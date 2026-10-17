import { z } from "zod";

// Keep these rules in sync with server/validations/review.validation.ts
export const reviewFormSchema = z.object({
  rating: z.number({ message: "Choose a rating" }).int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().min(5, "Please write at least 5 characters").max(1000, "Reviews can be up to 1000 characters"),
});
export type ReviewFormInput = z.infer<typeof reviewFormSchema>;
