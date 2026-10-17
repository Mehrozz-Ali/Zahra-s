"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BannerImageField } from "@/components/admin/banners/BannerImageField";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { bannerFormSchema, type BannerFormInput, type BannerFormOutput } from "@/lib/validations/banner";
import { useCreateBannerMutation, useUpdateBannerMutation, useUploadBannerImageMutation } from "@/services/bannerApi";
import type { Banner } from "@/types";

export function BannerForm({ banner, onDone }: { banner?: Banner; onDone: (message?: string) => void }) {
  const [create] = useCreateBannerMutation();
  const [update] = useUpdateBannerMutation();
  const [upload] = useUploadBannerImageMutation();
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [pictureError, setPictureError] = useState("");
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BannerFormInput, unknown, BannerFormOutput>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      eyebrow: banner?.eyebrow ?? "", title: banner?.title ?? "", subtitle: banner?.subtitle ?? "",
      buttonText: banner?.buttonText ?? "", buttonLink: banner?.buttonLink ?? "",
      textTheme: banner?.textTheme ?? "light", isActive: banner?.isActive ?? true,
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    setServerError("");
    setPictureError("");
    if (!banner?.image && !desktopFile) return setPictureError("Choose a picture");
    let id = banner?._id;
    try {
      if (banner) await update({ id: banner._id, changes: v }).unwrap();
      else id = (await create({ ...v, eyebrow: v.eyebrow || undefined, title: v.title || undefined, subtitle: v.subtitle || undefined, buttonText: v.buttonText || undefined, buttonLink: v.buttonLink || undefined }).unwrap())._id;
      if (!id) return;
      if (desktopFile) await upload({ id, file: desktopFile, kind: "desktop" }).unwrap();
      onDone(banner ? "The banner was updated." : "The banner was created and is now on the homepage.");
    } catch (e) {
      setServerError(`${getErrorMessage(e)}${!banner && id ? " The banner was saved without its picture. Edit it to try the picture again." : ""}`);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 border border-sand bg-white p-5">
      <h2 className="font-display text-3xl">{banner ? "Edit banner" : "New banner"}</h2>

      <BannerImageField label="Picture (shown on the right)" hint="Tall picture, about 640 x 800 px (4:5). It is always shown at this same small size next to the text, and any other shape is cropped to fit. JPG, PNG or WebP, up to 5 MB." shape="aspect-[4/5] max-w-[16rem]" currentUrl={banner?.image?.url} file={desktopFile} onFile={setDesktopFile} error={pictureError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Small line above the title" placeholder="e.g. New season" error={errors.eyebrow?.message} {...register("eyebrow")} />
        <FormField label="Title" placeholder="e.g. Eid Collection 2026" error={errors.title?.message} {...register("title")} />
        <div className="sm:col-span-2"><FormField label="Short text under the title" placeholder="e.g. Fresh styles in lawn, chiffon and silk" error={errors.subtitle?.message} {...register("subtitle")} /></div>
        <FormField label="Button text" placeholder="e.g. Shop now" hint="Leave empty for no button" error={errors.buttonText?.message} {...register("buttonText")} />
        <FormField label="Where the banner links to" placeholder="/category/new-arrivals" hint="A page on your store, like /shop, or a full https:// link. The whole banner becomes clickable." error={errors.buttonLink?.message} {...register("buttonLink")} />
      </div>

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-rose-dark)]" {...register("isActive")} /> Show on the homepage</label>

      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting} className="sm:w-auto">{banner ? "Save changes" : "Create banner"}</Button>
        <Button type="button" variant="outline" onClick={() => onDone()} className="sm:w-auto">Cancel</Button>
      </div>
    </form>
  );
}
