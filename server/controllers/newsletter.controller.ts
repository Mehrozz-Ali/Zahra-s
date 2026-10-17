import * as newsletterService from "../services/newsletter.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { SubscribeInput } from "../validations/newsletter.validation";

export const subscribe = asyncHandler(async (req, res) => {
  await newsletterService.subscribe((req.body as SubscribeInput).email);
  // Same answer whether or not the address was already subscribed
  sendSuccess(res, null, "Thanks for subscribing!", 201);
});
