"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { IconAction } from "@/components/ui/IconAction";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { useDeleteUploadedImageMutation, useUploadProductImagesMutation } from "@/services/productApi";
import type { ProductImage } from "@/types";

interface ImageUploaderProps {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  max?: number;
}

/**
 * Controlled multi-image field for the article form: upload, preview, choose the primary image, reorder, remove.
 * Images uploaded in this session and then removed are deleted from Cloudinary straight away.
 * Images that belong to a saved article are only dropped from the list; the server deletes them when the article is saved.
 */
export function ImageUploader({ value, onChange, max = 10 }: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedThisSession = useRef(new Set<string>());
  const [error, setError] = useState("");
  const [upload, { isLoading: uploading }] = useUploadProductImagesMutation();
  const [discard] = useDeleteUploadedImageMutation();

  const onFiles = async (fileList: FileList | null) => {
    setError("");
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;
    if (value.length + files.length > max) return setError(`You can add up to ${max} images (${max - value.length} more)`);
    if (files.some((f) => !IMAGE_TYPES.includes(f.type))) return setError("Only JPG, PNG or WebP images are allowed");
    if (files.some((f) => f.size > MAX_IMAGE_BYTES)) return setError("Each image must be 5 MB or smaller");
    try {
      const uploaded = await upload(files).unwrap();
      uploaded.forEach((img) => uploadedThisSession.current.add(img.publicId));
      const next = [...value, ...uploaded];
      onChange(next.some((i) => i.isPrimary) ? next : next.map((img, i) => ({ ...img, isPrimary: i === 0 })));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const remove = (index: number) => {
    const removed = value[index];
    if (!removed) return;
    const rest = value.filter((_, i) => i !== index);
    onChange(removed.isPrimary && rest[0] ? rest.map((img, i) => ({ ...img, isPrimary: i === 0 })) : rest);
    if (uploadedThisSession.current.delete(removed.publicId)) void discard(removed.publicId); // never saved: delete now
  };

  // The front picture shows first; the next picture after it is the back, shown when a customer hovers over the card
  const backIndex = value.findIndex((img) => !img.isPrimary);
  const role = (i: number) => (value[i]?.isPrimary ? "Front" : i === backIndex ? "Back (on hover)" : "");

  const makePrimary = (index: number) => onChange(value.map((img, i) => ({ ...img, isPrimary: i === index })));

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="space-y-3" aria-busy={uploading}>
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {value.map((img, i) => (
            <li key={img.publicId} className="space-y-2">
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                <Image src={img.url} alt={`Article image ${i + 1}${img.isPrimary ? " (front)" : ""}`} fill sizes="200px" className="object-cover" />
                {role(i) && <span className={`absolute left-2 top-2 px-2 py-0.5 text-xs uppercase tracking-wider ${img.isPrimary ? "bg-ink text-ivory" : "bg-white/90 text-ink"}`}>{role(i)}</span>}
              </div>
              <div className="flex items-center gap-0.5">
                <IconAction icon="left" label={`Move image ${i + 1} earlier`} onClick={() => move(i, -1)} disabled={i === 0} />
                <IconAction icon="right" label={`Move image ${i + 1} later`} onClick={() => move(i, 1)} disabled={i === value.length - 1} />
                {!img.isPrimary && <IconAction icon="primary" label={`Use image ${i + 1} as the front picture`} onClick={() => makePrimary(i)} />}
                <IconAction icon="delete" tone="danger" label={`Remove image ${i + 1}`} onClick={() => remove(i)} className="ml-auto" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input ref={inputRef} id={inputId} type="file" multiple accept={IMAGE_TYPES.join(",")} className="sr-only" disabled={uploading || value.length >= max} onChange={(e) => onFiles(e.target.files)} />
        <label htmlFor={inputId} className="inline-block cursor-pointer border border-ink px-5 py-2.5 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline hover:bg-ink hover:text-ivory">
          {uploading ? "Uploading..." : value.length === 0 ? "Choose images" : "Add more images"}
        </label>
        <span className="ml-3 text-sm text-stone">{value.length} of {max} - JPG, PNG or WebP, up to 5 MB each</span>
        <p className="mt-2 text-sm text-stone">Add the front of the suit first, then the back. Customers see the front on the shop pages and the back when they hover over it. Extra pictures appear on the article page.</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
