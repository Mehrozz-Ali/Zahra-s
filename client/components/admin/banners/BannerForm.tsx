"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BannerImageField } from "@/components/admin/banners/BannerImageField";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { bannerFormSchema, type BannerFormInput, type BannerFormOutput } from "@/lib/validations/banner";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import { useGetAdminProductsQuery } from "@/services/productApi";
import { useCreateBannerMutation, useUpdateBannerMutation, useUploadBannerImageMutation } from "@/services/bannerApi";
import type { Banner } from "@/types";

type Target = "article" | "category" | "shop" | "custom";
const selectClass = "h-11 w-full border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark";

function initialTarget(link: string | undefined): { target: Target; slug: string } {
  if (!link) return { target: "article", slug: "" };
  if (link.startsWith("/product/")) return { target: "article", slug: link.slice("/product/".length) };
  if (link.startsWith("/category/")) return { target: "category", slug: link.slice("/category/".length) };
  if (link === "/shop") return { target: "shop", slug: "" };
  return { target: "custom", slug: "" };
}

export function BannerForm({ banner, onDone }: { banner?: Banner; onDone: (message?: string) => void }) {
  const [create] = useCreateBannerMutation();
  const [update] = useUpdateBannerMutation();
  const [upload] = useUploadBannerImageMutation();
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [pictureError, setPictureError] = useState("");
  const [serverError, setServerError] = useState("");

  const { data: articleList } = useGetAdminProductsQuery({ page: 1, limit: 100, status: "active" });
  const { data: categories } = useGetCategoriesQuery();
  const start = useMemo(() => initialTarget(banner?.buttonLink), [banner?.buttonLink]);
  const [target, setTarget] = useState<Target>(start.target);
  const [articleSlug, setArticleSlug] = useState(start.target === "article" ? start.slug : "");
  const [categorySlug, setCategorySlug] = useState(start.target === "category" ? start.slug : "");
  const [customLink, setCustomLink] = useState(start.target === "custom" ? (banner?.buttonLink ?? "") : "");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<BannerFormInput, unknown, BannerFormOutput>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      eyebrow: banner?.eyebrow ?? "", title: banner?.title ?? "", subtitle: banner?.subtitle ?? "",
      buttonText: banner?.buttonText ?? "", buttonLink: banner?.buttonLink ?? "",
      textTheme: banner?.textTheme ?? "light", isActive: banner?.isActive ?? true,
    },
  });

  /** Work out the link from what the admin picked and store it in the form */
  const pick = (next: { target?: Target; article?: string; category?: string; custom?: string }) => {
    const t = next.target ?? target;
    const a = next.article ?? articleSlug;
    const c = next.category ?? categorySlug;
    const u = next.custom ?? customLink;
    if (next.target) setTarget(t);
    if (next.article !== undefined) setArticleSlug(a);
    if (next.category !== undefined) setCategorySlug(c);
    if (next.custom !== undefined) setCustomLink(u);
    const link = t === "article" ? (a ? `/product/${a}` : "") : t === "category" ? (c ? `/category/${c}` : "") : t === "shop" ? "/shop" : u;
    setValue("buttonLink", link, { shouldValidate: true });
  };

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
        <div className="space-y-1.5">
          <label htmlFor="banner-target" className="block text-sm">Where should the banner go when clicked?</label>
          <select id="banner-target" value={target} onChange={(e) => pick({ target: e.target.value as Target })} className={selectClass}>
            <option value="article">A specific article</option>
            <option value="category">A category</option>
            <option value="shop">The whole shop</option>
            <option value="custom">Another link (advanced)</option>
          </select>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          {target === "article" && (
            <>
              <label htmlFor="banner-article" className="block text-sm">Article</label>
              <select id="banner-article" value={articleSlug} onChange={(e) => pick({ article: e.target.value })} className={selectClass}>
                <option value="">Choose an article...</option>
                {articleSlug && !(articleList?.products ?? []).some((p) => p.slug === articleSlug) && <option value={articleSlug}>{articleSlug} (not in the active list)</option>}
                {(articleList?.products ?? []).map((p) => <option key={p._id} value={p.slug}>{p.name}</option>)}
              </select>
              <p className="text-xs text-stone">The button opens this article's page. Only active articles are listed.</p>
            </>
          )}
          {target === "category" && (
            <>
              <label htmlFor="banner-category" className="block text-sm">Category</label>
              <select id="banner-category" value={categorySlug} onChange={(e) => pick({ category: e.target.value })} className={selectClass}>
                <option value="">Choose a category...</option>
                {(categories ?? []).map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
              </select>
            </>
          )}
          {target === "shop" && <p className="text-sm text-stone">The button opens the full shop page.</p>}
          {target === "custom" && (
            <FormField label="Link" placeholder="/shop?sort=newest or https://..." hint="A page on your store starting with /, or a full https:// link." value={customLink} onChange={(e) => pick({ custom: e.target.value })} />
          )}
          {errors.buttonLink?.message && <p role="alert" className="text-sm text-red-700">{errors.buttonLink.message}</p>}
        </div>
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
