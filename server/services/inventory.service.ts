import type { UpdateQuery } from "mongoose";
import { Product, type IProduct } from "../models/Product";
import type { Size } from "../types";
import { ApiError } from "../utils/ApiError";

export interface StockItem {
  productId: string;
  name: string;
  size: Size;
  quantity: number;
}

const arrayFilters = (i: StockItem) => [{ "s.size": i.size }];
const change = (i: StockItem, sign: 1 | -1): UpdateQuery<IProduct> => ({
  $inc: { "sizes.$[s].stock": sign * i.quantity, totalStock: sign * i.quantity, soldCount: -sign * i.quantity },
});

/** Puts stock back, e.g. after a failed order or a cancellation. */
export async function restoreStock(items: StockItem[]): Promise<void> {
  for (const i of items) await Product.updateOne({ _id: i.productId }, change(i, 1), { arrayFilters: arrayFilters(i) });
  const ids = items.map((i) => i.productId);
  await Product.updateMany({ _id: { $in: ids }, status: "out_of_stock", totalStock: { $gt: 0 } }, { status: "active" });
}

/**
 * Takes stock for an order. Each decrement is a single atomic update that only matches while enough stock remains,
 * so two customers can never buy the last item. If any line fails, the lines already taken are put back.
 */
export async function reserveStock(items: StockItem[]): Promise<void> {
  const taken: StockItem[] = [];
  try {
    for (const i of items) {
      const result = await Product.updateOne(
        { _id: i.productId, sizes: { $elemMatch: { size: i.size, stock: { $gte: i.quantity } } } },
        change(i, -1),
        { arrayFilters: arrayFilters(i) },
      );
      if (result.modifiedCount !== 1) throw ApiError.conflict(`Sorry, ${i.name} (size ${i.size}) just sold out. Please review your cart.`);
      taken.push(i);
    }
  } catch (error) {
    await restoreStock(taken);
    throw error;
  }
  await Product.updateMany({ _id: { $in: items.map((i) => i.productId) }, status: "active", totalStock: { $lte: 0 } }, { status: "out_of_stock" });
}
