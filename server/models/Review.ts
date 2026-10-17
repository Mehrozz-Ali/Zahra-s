import { Schema, model, type Types } from "mongoose";

export interface IReview {
  user: Types.ObjectId;
  product: Types.ObjectId;
  order: Types.ObjectId; // the delivered order that proves the purchase
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // one review per customer per product
reviewSchema.index({ product: 1, createdAt: -1 });

export const Review = model<IReview>("Review", reviewSchema);
