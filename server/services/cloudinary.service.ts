import type { UploadApiOptions } from "cloudinary";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import type { CloudinaryImage } from "../types";
import { ApiError } from "../utils/ApiError";
import { isJpegPngOrWebp } from "../utils/imageSignature";

function assertConfigured(): void {
  if (!isCloudinaryConfigured) throw new ApiError(503, "Image uploads are not set up yet. Add the CLOUDINARY_* values to server/.env");
}

export async function uploadImage(buffer: Buffer, folder: string, transformation?: UploadApiOptions["transformation"]): Promise<CloudinaryImage> {
  assertConfigured();
  if (!isJpegPngOrWebp(buffer)) throw ApiError.badRequest("That file is not a valid JPG, PNG or WebP image");
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `women-clothing-store/${folder}`, resource_type: "image", transformation: transformation ?? [{ quality: "auto", fetch_format: "auto" }] },
        (error, result) => {
          if (error || !result) return reject(new ApiError(502, "Image upload failed. Please try again."));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}

/** Sample pictures created by the seed live in the website's own files, not on Cloudinary. */
const isSeedImage = (publicId: string): boolean => publicId.startsWith("seed/");

export async function deleteImage(publicId: string): Promise<void> {
  if (isSeedImage(publicId)) return;
  assertConfigured();
  await cloudinary.uploader.destroy(publicId);
}

/** For cleanup after the main action succeeded: a failed delete is logged, never thrown. */
export async function deleteImageQuietly(publicId?: string): Promise<void> {
  if (!publicId) return;
  await deleteImage(publicId).catch((e: unknown) => console.error(`Could not delete image ${publicId}:`, e));
}

/** Uploads several images. If any fails, the ones that succeeded are removed again so nothing is left orphaned. */
export async function uploadImages(buffers: Buffer[], folder: string, transformation?: UploadApiOptions["transformation"]): Promise<CloudinaryImage[]> {
  const results = await Promise.allSettled(buffers.map((b) => uploadImage(b, folder, transformation)));
  const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failure) {
    await Promise.all(uploaded.map((i) => deleteImageQuietly(i.publicId)));
    throw failure.reason instanceof ApiError ? failure.reason : new ApiError(502, "Image upload failed. Please try again.");
  }
  return uploaded;
}
