import { Product } from "../models/Product";
import { Wishlist } from "../models/Wishlist";
import { ApiError } from "../utils/ApiError";

const MAX_ITEMS = 100;

/** Ids only: cheap enough to load on every page so hearts show the right state. */
export async function getWishlistIds(userId: string): Promise<string[]> {
  const saved = await Wishlist.findOne({ user: userId }).select("products").lean();
  return (saved?.products ?? []).map(String);
}

/** Saved articles, newest first. Articles that were archived, unpublished or hidden are kept but flagged unavailable. */
export async function getWishlist(userId: string) {
  const ids = await getWishlistIds(userId);
  if (ids.length === 0) return [];

  const products = await Product.find({ _id: { $in: ids } })
    .select("-description -__v")
    .populate<{ category: { name: string; slug: string; isActive: boolean; isArchived: boolean } }>("category", "name slug isActive isArchived");
  const byId = new Map(products.map((p) => [p.id as string, p]));

  return [...ids].reverse().flatMap((id) => {
    const product = byId.get(id);
    if (!product) return [];
    const available = product.status === "active" && Boolean(product.category?.isActive) && !product.category.isArchived;
    return [{ product, available }];
  });
}

/** Idempotent: adding the same article twice is not an error. */
export async function addToWishlist(userId: string, productId: string): Promise<string[]> {
  const product = await Product.findOne({ _id: productId, status: "active" }).select("_id");
  if (!product) throw ApiError.notFound("Product not found");

  const ids = await getWishlistIds(userId);
  if (!ids.includes(productId)) {
    if (ids.length >= MAX_ITEMS) throw ApiError.badRequest(`Your wishlist is full (${MAX_ITEMS} items). Remove something to add more.`);
    await Wishlist.updateOne({ user: userId }, { $addToSet: { products: product._id } }, { upsert: true });
    ids.push(productId);
  }
  return ids;
}

export async function removeFromWishlist(userId: string, productId: string): Promise<string[]> {
  await Wishlist.updateOne({ user: userId }, { $pull: { products: productId } });
  return (await getWishlistIds(userId));
}
