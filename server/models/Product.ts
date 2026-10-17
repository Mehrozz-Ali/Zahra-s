import { Schema, model, type Types } from "mongoose";
import { PRODUCT_STATUSES, SIZES, type ProductStatus, type Size } from "../types";
import { generateUniqueSlug, randomCode } from "../utils/slugify";

export interface IProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

/** Stock of one size, e.g. S: 5. An article has one entry per size it is sold in. */
export interface IProductSize {
  size: Size;
  stock: number;
}

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  finalPrice: number; // discountPrice if set, else price (stored so it can be sorted and filtered)
  category: Types.ObjectId;
  images: IProductImage[];
  sizes: IProductSize[];
  material?: string;
  brand?: string;
  sku: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  onSale: boolean;
  status: ProductStatus;
  rating: number;
  numReviews: number;
  soldCount: number;
  totalStock: number;
  createdAt: Date;
  updatedAt: Date;
}

// Slugs that would collide with fixed API routes such as GET /products/filters
const RESERVED_SLUGS = new Set(["admin", "filters", "images"]);

export const sumStock = (sizes: IProductSize[]): number => sizes.reduce((sum, s) => sum + s.stock, 0);

const imageSchema = new Schema<IProductImage>(
  { url: { type: String, required: true }, publicId: { type: String, required: true }, isPrimary: { type: Boolean, default: false } },
  { _id: false },
);

const sizeSchema = new Schema<IProductSize>(
  { size: { type: String, enum: SIZES, required: true }, stock: { type: Number, required: true, min: 0, default: 0 } },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 300 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    finalPrice: { type: Number, default: 0, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [imageSchema], default: [] },
    sizes: { type: [sizeSchema], default: [] },
    material: { type: String, trim: true },
    brand: { type: String, trim: true },
    sku: { type: String, unique: true, uppercase: true, trim: true },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    status: { type: String, enum: PRODUCT_STATUSES, default: "draft" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    totalStock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

productSchema.virtual("discountPercentage").get(function () {
  return this.discountPrice && this.price > 0 ? Math.round(((this.price - this.discountPrice) / this.price) * 100) : 0;
});

productSchema.index({ name: "text", description: "text", sku: "text" }, { weights: { name: 10, sku: 5, description: 1 }, name: "product_text_search" });
productSchema.index({ status: 1, category: 1, createdAt: -1 });
productSchema.index({ status: 1, finalPrice: 1 });
productSchema.index({ status: 1, featured: 1 });
productSchema.index({ status: 1, newArrival: 1 });
productSchema.index({ status: 1, bestSeller: 1 });
productSchema.index({ status: 1, soldCount: -1 });
productSchema.index({ status: 1, rating: -1 });

productSchema.pre("validate", async function () {
  if (this.isNew || !this.slug) {
    this.slug = await generateUniqueSlug(this.slug || this.name || "", async (s) => RESERVED_SLUGS.has(s) || !!(await Product.exists({ slug: s, _id: { $ne: this._id } })));
  }

  if (!this.sku) {
    let sku = `SKU-${randomCode(3)}`;
    while (await Product.exists({ sku })) sku = `SKU-${randomCode(3)}`;
    this.sku = sku;
  }

  if (this.discountPrice !== undefined && this.discountPrice !== null && this.discountPrice >= this.price) {
    this.invalidate("discountPrice", "Discount price must be lower than the regular price");
  }

  const sizes = new Set<string>();
  for (const s of this.sizes) {
    if (sizes.has(s.size)) this.invalidate("sizes", `Duplicate size ${s.size}`);
    sizes.add(s.size);
  }

  if (this.images.length > 0) {
    const found = this.images.findIndex((img) => img.isPrimary);
    const primaryIndex = found === -1 ? 0 : found;
    this.images.forEach((img, i) => {
      img.isPrimary = i === primaryIndex;
    });
  }

  this.totalStock = sumStock(this.sizes);
  this.finalPrice = this.discountPrice ?? this.price;
});

export const Product = model<IProduct>("Product", productSchema);
