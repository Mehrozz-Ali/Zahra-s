import { Schema, model, type Types } from "mongoose";
import { SIZES, type Size } from "../types";

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  size: Size;
  quantity: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  size: { type: String, enum: SIZES, required: true },
  quantity: { type: Number, required: true, min: 1, max: 10 },
});

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

// Prices are never stored in the cart; they are read from the product at request time.
export const Cart = model<ICart>("Cart", cartSchema);
