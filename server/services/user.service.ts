import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import type { AddressInput, UpdateAddressInput, UpdateProfileInput } from "../validations/user.validation";
import { deleteImage, uploadImage } from "./cloudinary.service";

const MAX_ADDRESSES = 10;

async function loadUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.unauthorized();
  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await loadUser(userId);
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone || undefined;
  await user.save();
  return user;
}

export async function setAvatar(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw ApiError.badRequest("Please choose an image to upload");
  const user = await loadUser(userId);
  const uploaded = await uploadImage(file.buffer, "avatars", [{ width: 400, height: 400, crop: "fill", gravity: "face" }, { quality: "auto", fetch_format: "auto" }]);
  const previous = user.avatar?.publicId;
  user.avatar = uploaded;
  await user.save();
  if (previous) await deleteImage(previous).catch((e: unknown) => console.error("Could not delete old avatar:", e));
  return user;
}

export async function removeAvatar(userId: string) {
  const user = await loadUser(userId);
  const previous = user.avatar?.publicId;
  user.avatar = undefined;
  await user.save();
  if (previous) await deleteImage(previous).catch((e: unknown) => console.error("Could not delete avatar:", e));
  return user;
}

export async function addAddress(userId: string, input: AddressInput) {
  const user = await loadUser(userId);
  if (user.addresses.length >= MAX_ADDRESSES) throw ApiError.badRequest(`You can save up to ${MAX_ADDRESSES} addresses`);
  const makeDefault = input.isDefault || user.addresses.length === 0; // first address is always the default
  if (makeDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push({ ...input, country: "Pakistan", isDefault: makeDefault });
  await user.save();
  return user;
}

export async function updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
  const user = await loadUser(userId);
  const address = user.addresses.find((a) => String(a._id) === addressId);
  if (!address) throw ApiError.notFound("Address not found");
  const { isDefault, ...fields } = input;
  Object.assign(address, fields);
  if (isDefault) user.addresses.forEach((a) => { a.isDefault = a === address; }); // you can't un-default; pick another instead
  await user.save();
  return user;
}

export async function deleteAddress(userId: string, addressId: string) {
  const user = await loadUser(userId);
  const index = user.addresses.findIndex((a) => String(a._id) === addressId);
  if (index === -1) throw ApiError.notFound("Address not found");
  const [removed] = user.addresses.splice(index, 1);
  const first = user.addresses[0];
  if (removed?.isDefault && first) first.isDefault = true; // promote another address
  await user.save();
  return user;
}
