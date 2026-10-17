import { Banner, MAX_BANNERS } from "../models/Banner";
import { ApiError } from "../utils/ApiError";
import type { CreateBannerInput, UpdateBannerInput } from "../validations/banner.validation";
import { deleteImageQuietly, uploadImage } from "./cloudinary.service";

export type BannerKind = "desktop" | "mobile";

// Tall 4:5 picture shown beside the text. "fill" crops to the exact shape, so every slide lines up.
const TRANSFORMS = {
  desktop: [{ width: 640, height: 800, crop: "fill", gravity: "auto" }, { quality: "auto", fetch_format: "auto" }],
  mobile: [{ width: 1080, height: 1350, crop: "fill", gravity: "auto" }, { quality: "auto", fetch_format: "auto" }],
};

async function findOrFail(id: string) {
  const banner = await Banner.findById(id);
  if (!banner) throw ApiError.notFound("Banner not found");
  return banner;
}

/** Storefront: visible banners that have a picture, in order. */
export const listPublicBanners = () =>
  Banner.find({ isActive: true, "image.url": { $exists: true, $ne: null } }).sort({ sortOrder: 1, createdAt: 1 }).select("-__v").lean();

export const listAdminBanners = () => Banner.find().sort({ sortOrder: 1, createdAt: 1 }).select("-__v").lean();

export async function createBanner(input: CreateBannerInput) {
  if ((await Banner.countDocuments()) >= MAX_BANNERS) {
    throw ApiError.badRequest(`You can have up to ${MAX_BANNERS} banners. Delete one to add another.`);
  }
  const last = await Banner.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
  return Banner.create({ ...input, sortOrder: last ? last.sortOrder + 1 : 0 });
}

export async function updateBanner(id: string, input: UpdateBannerInput) {
  const banner = await findOrFail(id);
  Object.assign(banner, input);
  await banner.save();
  return banner;
}

export async function setBannerImage(id: string, kind: BannerKind, file: Express.Multer.File | undefined) {
  if (!file) throw ApiError.badRequest("Please choose an image to upload");
  const banner = await findOrFail(id);
  const uploaded = await uploadImage(file.buffer, "banners", TRANSFORMS[kind]);
  const field = kind === "mobile" ? "mobileImage" : "image";
  const previous = banner[field]?.publicId;
  banner[field] = uploaded;
  await banner.save();
  await deleteImageQuietly(previous);
  return banner;
}

export async function removeBannerImage(id: string, kind: BannerKind) {
  const banner = await findOrFail(id);
  const field = kind === "mobile" ? "mobileImage" : "image";
  const previous = banner[field]?.publicId;
  banner[field] = undefined;
  await banner.save();
  await deleteImageQuietly(previous);
  return banner;
}

/** `ids` is the new order, first to last. */
export async function reorderBanners(ids: string[]) {
  await Banner.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } } })));
}

export async function deleteBanner(id: string) {
  const banner = await findOrFail(id);
  const publicIds = [banner.image?.publicId, banner.mobileImage?.publicId];
  await banner.deleteOne();
  await Promise.all(publicIds.map((p) => deleteImageQuietly(p)));
}
