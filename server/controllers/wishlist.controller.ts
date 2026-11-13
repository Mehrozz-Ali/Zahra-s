import { getAuthUser } from "../middleware/auth";
import * as wishlistService from "../services/wishlist.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";

export const getWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { items: await wishlistService.getWishlist(getAuthUser(req).id) }, "Wishlist fetched successfully");
});

export const getWishlistIds = asyncHandler(async (req, res) => {
  sendSuccess(res, { ids: await wishlistService.getWishlistIds(getAuthUser(req).id) }, "Wishlist fetched successfully");
});

export const addToWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { ids: await wishlistService.addToWishlist(getAuthUser(req).id, String(req.params.productId)) }, "Added to wishlist", 201);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { ids: await wishlistService.removeFromWishlist(getAuthUser(req).id, String(req.params.productId)) }, "Removed from wishlist");
});

export const lookupWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { items: await wishlistService.getWishlistItems((req.body as { ids: string[] }).ids) }, "Wishlist fetched successfully");
});

export const mergeWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { ids: await wishlistService.mergeWishlist(getAuthUser(req).id, (req.body as { ids: string[] }).ids) }, "Wishlist merged");
});
