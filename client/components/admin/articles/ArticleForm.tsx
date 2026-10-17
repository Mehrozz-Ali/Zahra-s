"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SizeStock } from "@/components/admin/articles/SizeStock";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SIZE_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { articleFormSchema, toFormDefaults, toProductInput, type ArticleFormInput, type ArticleFormOutput } from "@/lib/validations/article";
import { useGetAdminCategoriesQuery } from "@/services/categoryApi";
import { useCreateProductMutation, useDeleteUploadedImageMutation, useUpdateProductMutation } from "@/services/productApi";
import type { Product } from "@/types";

const area = "w-full border border-sand bg-white p-4 text-base outline-none focus:border-rose-dark aria-[invalid=true]:border-red-700";
const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="space-y-4 border border-sand bg-white p-5">
    <div><h2 className="font-display text-2xl">{title}</h2>{hint && <p className="text-sm text-stone">{hint}</p>}</div>
    {children}
  </section>
);

/** Add a new article, or edit a saved one when `product` is given. */
export function ArticleForm({ product }: { product?: Product }) {
  const router = useRouter();
  const mode = product ? "edit" : "create";
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [discardImage] = useDeleteUploadedImageMutation();
  const { data: categories, isLoading: categoriesLoading } = useGetAdminCategoriesQuery();
  const [serverError, setServerError] = useState("");
  const [serverDetails, setServerDetails] = useState<string[]>([]);
  const savedImageIds = useRef(new Set(product?.images.map((i) => i.publicId) ?? []));

  const { register, control, handleSubmit, watch, getValues, formState: { errors, isSubmitting } } = useForm<ArticleFormInput, unknown, ArticleFormOutput>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: toFormDefaults(product),
  });
  const status = watch("status");

  // Archived categories can't take new articles, but an article already in one keeps showing it.
  // The article's own category is always an option, even before the list has loaded, so the dropdown starts on the right value.
  const current = product?.category;
  const listed = (categories ?? []).filter((c) => !c.isArchived || c._id === current?._id);
  const categoryOptions = current && !listed.some((c) => c._id === current._id) ? [{ _id: current._id, name: current.name, isActive: true }, ...listed] : listed;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(""); setServerDetails([]);
    try {
      const body = toProductInput(values, mode);
      const saved = product ? await updateProduct({ id: product._id, changes: body }).unwrap() : await createProduct(body).unwrap();
      router.push(`/admin/articles?${new URLSearchParams({ saved: saved.name, mode: product ? "updated" : status === "active" ? "published" : "saved" })}`);
    } catch (error) {
      setServerError(getErrorMessage(error));
      setServerDetails(getFieldErrors(error));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  /** Leaving without saving: images uploaded in this session were never attached to an article, so remove them from Cloudinary. */
  const cancel = async () => {
    const unsaved = getValues("images").filter((i) => !savedImageIds.current.has(i.publicId));
    await Promise.all(unsaved.map((i) => discardImage(i.publicId).unwrap().catch(() => undefined)));
    router.push("/admin/articles");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">{product ? "Edit article" : "Add new article"}</h1>
          <p className="text-sm text-stone">{product ? `Changes are live in the store as soon as you save (${product.sku}).` : "Fill in the details, then publish. Active articles appear in the store straight away."}</p>
        </div>
        <Link href="/admin/articles" onClick={(e) => { e.preventDefault(); void cancel(); }} className="text-sm underline underline-offset-4 hover:text-rose-dark">Back to articles</Link>
      </div>

      {(serverError || Object.keys(errors).length > 0) && (
        <div role="alert" className="space-y-1 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">{serverError || "Please fix the highlighted fields and try again."}</p>
          {serverDetails.length > 0 && <ul className="list-disc pl-5">{serverDetails.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      <Section title="Basic information">
        <FormField label="Article name" error={errors.name?.message} placeholder="e.g. Floral Summer Dress" {...register("name")} />
        <div className="space-y-1.5">
          <label htmlFor="shortDescription" className="block text-sm font-medium">Short description</label>
          <input id="shortDescription" aria-invalid={errors.shortDescription ? true : undefined} className="h-12 w-full border border-sand bg-white px-4 text-base outline-none focus:border-rose-dark" placeholder="One line shown on article cards" {...register("shortDescription")} />
          {errors.shortDescription && <p role="alert" className="text-sm text-red-700">{errors.shortDescription.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium">Full description</label>
          <textarea id="description" rows={6} aria-invalid={errors.description ? true : undefined} className={area} placeholder="Fabric, fit, care instructions..." {...register("description")} />
          {errors.description && <p role="alert" className="text-sm text-red-700">{errors.description.message}</p>}
        </div>
      </Section>

      <Section title="Pricing" hint="Prices are in PKR.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Price (Rs.)" type="number" inputMode="numeric" min={1} error={errors.price?.message} {...register("price")} />
          <FormField label="Discount price (Rs.)" type="number" inputMode="numeric" min={1} error={errors.discountPrice?.message} hint="Optional. Must be lower than the price" {...register("discountPrice")} />
        </div>
      </Section>

      <Section title="Category" hint="Categories come from your category list.">
        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-sm font-medium">Category</label>
          <select id="category" aria-invalid={errors.category ? true : undefined} disabled={categoriesLoading} className="h-12 w-full border border-sand bg-white px-3 text-base outline-none focus:border-rose-dark aria-[invalid=true]:border-red-700 sm:max-w-sm" {...register("category")}>
            <option value="">{categoriesLoading ? "Loading categories..." : "Select a category"}</option>
            {categoryOptions.map((c) => <option key={c._id} value={c._id}>{c.name}{!c.isActive ? " (hidden)" : ""}</option>)}
          </select>
          {errors.category && <p role="alert" className="text-sm text-red-700">{errors.category.message}</p>}
          {!categoriesLoading && categoryOptions.length === 0 && <p className="text-sm text-stone">No categories yet. <Link href="/admin/categories" className="underline underline-offset-4">Create one first</Link>.</p>}
          {categoryOptions.some((c) => !c.isActive) && <p className="text-sm text-stone">Articles in a hidden category are not shown in the store.</p>}
        </div>
      </Section>

      <Section title="Pictures" hint="Upload photos of this same article: the front first, then the back. Shoppers see the front, and the back when they hover over it.">
        <Controller control={control} name="images" render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />} />
        {errors.images && <p role="alert" className="text-sm text-red-700">{errors.images.message ?? errors.images.root?.message}</p>}
      </Section>

      <Section title="Sizes and stock" hint="Choose the sizes this article is sold in, then enter the stock for each size. One article is one design in one colour.">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Sizes</legend>
          <Controller control={control} name="sizes" render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((size) => {
                const on = field.value.includes(size);
                return (
                  <label key={size} className={`cursor-pointer border px-4 py-2 text-sm has-[:focus-visible]:outline ${on ? "border-ink bg-ink text-ivory" : "border-sand bg-white hover:border-ink"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => field.onChange(SIZE_OPTIONS.filter((s) => (s === size ? !on : field.value.includes(s))))} />
                    {size}
                  </label>
                );
              })}
            </div>
          )} />
          {errors.sizes && <p role="alert" className="mt-1 text-sm text-red-700">{errors.sizes.message ?? errors.sizes.root?.message}</p>}
        </fieldset>
        <SizeStock register={register} watch={watch} errors={errors} />
      </Section>

      <Section title="Details" hint="Optional.">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Material" error={errors.material?.message} placeholder="e.g. Lawn" {...register("material")} />
          <FormField label="Brand" error={errors.brand?.message} {...register("brand")} />
          <FormField label="SKU" error={errors.sku?.message} hint={product ? "Must be unique" : "Leave empty to generate one"} placeholder="ZH-DRESS-001" className="h-12 w-full border border-sand bg-white px-4 text-base uppercase outline-none focus:border-rose-dark aria-[invalid=true]:border-red-700" {...register("sku")} />
        </div>
      </Section>

      <Section title="Where it appears" hint="These decide which homepage sections feature the article.">
        <div className="grid gap-3 sm:grid-cols-2">
          {([["featured", "Featured product"], ["newArrival", "New arrival"], ["bestSeller", "Best seller"], ["onSale", "On sale"]] as const).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-rose-dark)]" {...register(name)} />{label}</label>
          ))}
        </div>
      </Section>

      <Section title="Status">
        <fieldset>
          <legend className="sr-only">Status</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {STATUS_OPTIONS.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-start gap-3 border border-sand p-3 has-[:checked]:border-ink has-[:checked]:bg-sand/40">
                <input type="radio" value={o.value} className="mt-1 accent-[var(--color-rose-dark)]" {...register("status")} />
                <span><span className="block text-sm font-medium">{o.label}</span><span className="block text-xs text-stone">{o.hint}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        {status === "active" && <p className="text-sm text-stone">An article with no stock is shown as out of stock automatically.</p>}
      </Section>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-sand bg-ivory/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button type="submit" loading={isSubmitting} className="sm:w-auto">{product ? "Save changes" : status === "active" ? "Publish Article" : "Save Article"}</Button>
        <Button type="button" variant="outline" onClick={() => void cancel()} className="sm:w-auto">Cancel</Button>
      </div>
    </form>
  );
}
