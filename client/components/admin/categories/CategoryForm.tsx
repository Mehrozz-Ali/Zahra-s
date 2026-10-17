"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { categoryFormSchema, type CategoryFormInput, type CategoryFormOutput } from "@/lib/validations/category";
import { useCreateCategoryMutation, useRemoveCategoryImageMutation, useUpdateCategoryMutation, useUploadCategoryImageMutation } from "@/services/categoryApi";
import type { Category } from "@/types";

export function CategoryForm({ category, onDone }: { category?: Category; onDone: (message?: string) => void }) {
  const [create] = useCreateCategoryMutation();
  const [update] = useUpdateCategoryMutation();
  const [uploadImage, { isLoading: uploading }] = useUploadCategoryImageMutation();
  const [removeImage] = useRemoveCategoryImageMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(category?.image?.url);
  const [imageError, setImageError] = useState("");
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryFormInput, unknown, CategoryFormOutput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: category?.name ?? "", description: category?.description ?? "", sortOrder: category?.sortOrder ?? 0, isActive: category?.isActive ?? true },
  });

  const onSubmit = handleSubmit(async (v) => {
    setServerError("");
    try {
      if (category) await update({ id: category._id, changes: { name: v.name, description: v.description, sortOrder: v.sortOrder, isActive: v.isActive } }).unwrap();
      else await create({ name: v.name, description: v.description || undefined, sortOrder: v.sortOrder, isActive: v.isActive }).unwrap();
      onDone(category ? `"${v.name}" was updated.` : `"${v.name}" was created. You can add an image by editing it.`);
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  });

  const onFile = async (file: File | undefined) => {
    setImageError("");
    if (fileRef.current) fileRef.current.value = "";
    if (!file || !category) return;
    if (!IMAGE_TYPES.includes(file.type)) return setImageError("Only JPG, PNG or WebP images are allowed");
    if (file.size > MAX_IMAGE_BYTES) return setImageError("The image must be 5 MB or smaller");
    try { setImage((await uploadImage({ id: category._id, file }).unwrap()).image?.url); } catch (e) { setImageError(getErrorMessage(e)); }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-sand bg-white p-5">
      <h2 className="font-display text-3xl">{category ? `Edit ${category.name}` : "New category"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" error={errors.name?.message} placeholder="e.g. Summer Collection" {...register("name")} />
        <FormField label="Sort order" type="number" inputMode="numeric" min={0} error={errors.sortOrder?.message} hint="Lower numbers come first" {...register("sortOrder")} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="cat-description" className="block text-sm font-medium">Description</label>
        <textarea id="cat-description" rows={3} aria-invalid={errors.description ? true : undefined} className="w-full border border-sand bg-white p-3 text-base outline-none focus:border-rose-dark" {...register("description")} />
        {errors.description && <p role="alert" className="text-sm text-red-700">{errors.description.message}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-rose-dark)]" {...register("isActive")} /> Visible in the store</label>

      {category && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Image</p>
          <div className="flex items-center gap-4">
            <span className="relative block h-24 w-20 overflow-hidden bg-sand">{image && <Image src={image} alt="" fill sizes="80px" className="object-cover" />}</span>
            <div className="space-x-4 text-sm">
              <input ref={fileRef} id="cat-image" type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
              <label htmlFor="cat-image" className="inline-block cursor-pointer border border-ink px-4 py-2 hover:bg-ink hover:text-ivory has-[:focus-visible]:outline">{uploading ? "Uploading..." : image ? "Replace image" : "Upload image"}</label>
              {image && <button type="button" aria-label="Remove image" className="inline-flex items-center gap-1.5 text-red-800 underline underline-offset-4" onClick={async () => { setImageError(""); try { await removeImage(category._id).unwrap(); setImage(undefined); } catch (e) { setImageError(getErrorMessage(e)); } }}><Trash2 className="h-4 w-4" aria-hidden />Remove</button>}
            </div>
          </div>
          {imageError && <p role="alert" className="text-sm text-red-700">{imageError}</p>}
        </div>
      )}

      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting} className="sm:w-auto">{category ? "Save changes" : "Create category"}</Button>
        <Button type="button" variant="outline" onClick={() => onDone()} className="sm:w-auto">Cancel</Button>
      </div>
    </form>
  );
}
