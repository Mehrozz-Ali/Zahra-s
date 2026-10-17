import { z } from "zod";
import { optionalText } from "./common";

const slug = z.string().trim().toLowerCase().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens");
const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80);
const sortOrder = z.number().int().min(0).max(9999);

export const createCategorySchema = z.object({
  name,
  description: optionalText(500),
  isActive: z.boolean().default(true),
  sortOrder: sortOrder.default(0),
});

export const updateCategorySchema = z.object({
  name: name.optional(),
  slug: slug.optional(),
  description: z.string().trim().max(500).optional(), // "" clears it
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  sortOrder: sortOrder.optional(),
});

export const categorySlugParamSchema = z.object({ slug });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
