import { getAuthUser } from "../middleware/auth";
import * as cartService from "../services/cart.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { CartLineInput } from "../validations/cart.validation";

const linesOf = (body: unknown): CartLineInput[] => (body as { lines: CartLineInput[] }).lines;

export const priceCart = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.priceCartLines(linesOf(req.body)), "Cart priced successfully");
});

export const getCart = asyncHandler(async (req, res) => {
  sendSuccess(res, { lines: await cartService.getSavedCart(getAuthUser(req).id) }, "Cart fetched successfully");
});

export const saveCart = asyncHandler(async (req, res) => {
  sendSuccess(res, { lines: await cartService.saveCart(getAuthUser(req).id, linesOf(req.body)) }, "Cart saved");
});
