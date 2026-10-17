import { z } from "zod";

// Keep these rules in sync with server/validations/category.validation.ts
export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(500, "Keep it under 500 characters"),
  sortOrder: z.coerce.number({ message: "Enter a number" }).int("Whole number").min(0, "0 or more").max(9999),
  isActive: z.boolean(),
});
export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormOutput = z.output<typeof categoryFormSchema>;
