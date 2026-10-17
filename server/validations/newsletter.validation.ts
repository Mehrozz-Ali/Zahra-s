import { z } from "zod";

export const subscribeSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address") });
export type SubscribeInput = z.infer<typeof subscribeSchema>;
