import { Schema, model } from "mongoose";
import type { CloudinaryImage } from "../types";
import { generateUniqueSlug } from "../utils/slugify";

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: CloudinaryImage;
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    image: { url: String, publicId: String },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, isArchived: 1, sortOrder: 1 });

categorySchema.pre("validate", async function () {
  if (this.isNew || !this.slug) {
    this.slug = await generateUniqueSlug(this.slug || this.name || "", async (s) => !!(await Category.exists({ slug: s, _id: { $ne: this._id } })));
  }
});

export const Category = model<ICategory>("Category", categorySchema);
