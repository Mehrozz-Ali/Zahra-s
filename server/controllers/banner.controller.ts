import * as bannerService from "../services/banner.service";
import type { BannerKind } from "../services/banner.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { CreateBannerInput, UpdateBannerInput } from "../validations/banner.validation";

const kindOf = (query: unknown): BannerKind => ((query as { kind?: string }).kind === "mobile" ? "mobile" : "desktop");

export const listBanners = asyncHandler(async (_req, res) => {
  sendSuccess(res, { banners: await bannerService.listPublicBanners() }, "Banners fetched successfully");
});

export const listAdminBanners = asyncHandler(async (_req, res) => {
  sendSuccess(res, { banners: await bannerService.listAdminBanners() }, "Banners fetched successfully");
});

export const createBanner = asyncHandler(async (req, res) => {
  sendSuccess(res, { banner: await bannerService.createBanner(req.body as CreateBannerInput) }, "Banner created", 201);
});

export const updateBanner = asyncHandler(async (req, res) => {
  sendSuccess(res, { banner: await bannerService.updateBanner(String(req.params.id), req.body as UpdateBannerInput) }, "Banner updated");
});

export const uploadBannerImage = asyncHandler(async (req, res) => {
  sendSuccess(res, { banner: await bannerService.setBannerImage(String(req.params.id), kindOf(req.query), req.file) }, "Banner image updated");
});

export const deleteBannerImage = asyncHandler(async (req, res) => {
  sendSuccess(res, { banner: await bannerService.removeBannerImage(String(req.params.id), kindOf(req.query)) }, "Banner image removed");
});

export const reorderBanners = asyncHandler(async (req, res) => {
  await bannerService.reorderBanners((req.body as { ids: string[] }).ids);
  sendSuccess(res, { banners: await bannerService.listAdminBanners() }, "Banners reordered");
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(String(req.params.id));
  sendSuccess(res, {}, "Banner deleted");
});
