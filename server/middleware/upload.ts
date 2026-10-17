import type { RequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const createUploader = (maxFiles: number) =>
  multer({
    storage: multer.memoryStorage(), // files go straight to Cloudinary; nothing is written to disk
    limits: { fileSize: MAX_IMAGE_BYTES, files: maxFiles },
    fileFilter: (_req, file, cb) =>
      ALLOWED_TYPES.has(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest("Only JPG, PNG or WebP images are allowed")),
  });

/** Turns multer's errors into our standard API errors. */
const withFriendlyErrors =
  (run: RequestHandler, maxFiles: number): RequestHandler =>
  (req, res, next) => {
    run(req, res, (error?: unknown) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") return next(ApiError.badRequest("Each image must be 5 MB or smaller"));
        if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
          return next(ApiError.badRequest(maxFiles === 1 ? "Upload one image at a time" : `You can upload up to ${maxFiles} images at a time`));
        }
        return next(ApiError.badRequest("Invalid upload"));
      }
      next(error);
    });
  };

/** One image from multipart field `field` -> req.file */
export const uploadSingleImage = (field: string): RequestHandler => withFriendlyErrors(createUploader(1).single(field), 1);

/** Up to `maxFiles` images from multipart field `field` -> req.files */
export const uploadMultipleImages = (field: string, maxFiles: number): RequestHandler =>
  withFriendlyErrors(createUploader(maxFiles).array(field, maxFiles), maxFiles);
