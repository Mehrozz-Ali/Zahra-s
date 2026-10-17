import { getAuthUser } from "../middleware/auth";
import * as userService from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { AddressInput, UpdateAddressInput, UpdateProfileInput } from "../validations/user.validation";

const idOf = (req: Parameters<typeof getAuthUser>[0]): string => getAuthUser(req).id;

export const updateProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: await userService.updateProfile(idOf(req), req.body as UpdateProfileInput) }, "Profile updated");
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: await userService.setAvatar(idOf(req), req.file) }, "Profile photo updated");
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: await userService.removeAvatar(idOf(req)) }, "Profile photo removed");
});

export const addAddress = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: await userService.addAddress(idOf(req), req.body as AddressInput) }, "Address added", 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  sendSuccess(res, { user: await userService.updateAddress(idOf(req), id, req.body as UpdateAddressInput) }, "Address updated");
});

export const deleteAddress = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: await userService.deleteAddress(idOf(req), String(req.params.id)) }, "Address deleted");
});
