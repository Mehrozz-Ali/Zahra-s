"use client";

import clsx from "clsx";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { SIZE_OPTIONS, SORT_OPTIONS, withQuery, type ShopParams } from "@/lib/shopParams";
import { formatPrice } from "@/lib/format";
import type { Category, ProductFilters, ProductSort } from "@/types";
import { DebouncedInput } from "./DebouncedInput";

interface ShopBrowserProps {
  params: ShopParams;
  basePath: string;
  facets: ProductFilters;
  categories: Category[]; // empty on category pages
  total: number;
  children: ReactNode; // the product grid and pagination, rendered on the server
}

const FILTER_KEYS: Array<keyof ShopParams> = ["q", "category", "size", "minPrice", "maxPrice", "inStock", "onSale", "featured", "newArrival", "bestSeller"];
const field = "h-10 w-full border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark";
const legend = "mb-3 text-xs font-medium uppercase tracking-widest text-stone";

export function ShopBrowser({ params, basePath, facets, categories, total, children }: ShopBrowserProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Mobile filter drawer: lock scroll and close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const update = (patch: Partial<ShopParams>) =>
    startTransition(() => router.push(withQuery(basePath, { ...params, ...patch, page: undefined }), { scroll: false }));
  const clearAll = () => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])) as Partial<ShopParams>);
  const toggle = <K extends keyof ShopParams>(key: K, value: ShopParams[K]) => update({ [key]: params[key] === value ? undefined : value } as Partial<ShopParams>);
  const price = (key: "minPrice" | "maxPrice") => (v: string) => update({ [key]: v.trim() === "" || Number(v) < 0 || Number.isNaN(Number(v)) ? undefined : Number(v) });

  const chips: Array<{ label: string; clear: Partial<ShopParams> }> = [];
  if (params.q) chips.push({ label: `Search: ${params.q}`, clear: { q: undefined } });
  if (params.category && categories.length > 0) chips.push({ label: categories.find((c) => c.slug === params.category)?.name ?? params.category, clear: { category: undefined } });
  if (params.size) chips.push({ label: `Size ${params.size}`, clear: { size: undefined } });
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    chips.push({ label: `${params.minPrice !== undefined ? formatPrice(params.minPrice) : "Any"} - ${params.maxPrice !== undefined ? formatPrice(params.maxPrice) : "Any"}`, clear: { minPrice: undefined, maxPrice: undefined } });
  }
  const flags = [["inStock", "In stock"], ["onSale", "On sale"], ["featured", "Featured"], ["newArrival", "New arrivals"], ["bestSeller", "Best sellers"]] as const;
  for (const [key, label] of flags) if (params[key]) chips.push({ label, clear: { [key]: undefined } });

  const filters = (
    <div className="space-y-8">
      <div>
        <label htmlFor="shop-search" className={legend}>Search</label>
        <DebouncedInput id="shop-search" type="search" value={params.q ?? ""} onCommit={(v) => update({ q: v.trim() || undefined })} placeholder="Name, SKU or category" className={field} />
      </div>

      {categories.length > 0 && (
        <fieldset>
          <legend className={legend}>Category</legend>
          <ul className="space-y-1 text-sm">
            {[{ slug: undefined, name: "All" }, ...categories].map((c) => (
              <li key={c.slug ?? "all"}>
                <button type="button" aria-pressed={params.category === c.slug} onClick={() => update({ category: c.slug })} className={clsx("py-1 hover:text-rose-dark", params.category === c.slug ? "font-medium underline underline-offset-4" : "text-stone")}>{c.name}</button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>Price (Rs.)</legend>
        <div className="flex items-center gap-2">
          <DebouncedInput aria-label="Minimum price" type="number" min={0} inputMode="numeric" value={params.minPrice?.toString() ?? ""} onCommit={price("minPrice")} placeholder={facets.priceRange.max > 0 ? String(facets.priceRange.min) : "Min"} className={field} />
          <span aria-hidden>-</span>
          <DebouncedInput aria-label="Maximum price" type="number" min={0} inputMode="numeric" value={params.maxPrice?.toString() ?? ""} onCommit={price("maxPrice")} placeholder={facets.priceRange.max > 0 ? String(facets.priceRange.max) : "Max"} className={field} />
        </div>
      </fieldset>

      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className={legend}>Size</legend>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.filter((s) => facets.sizes.includes(s)).map((s) => (
              <button key={s} type="button" aria-pressed={params.size === s} onClick={() => toggle("size", s)} className={clsx("h-10 min-w-10 border px-3 text-sm", params.size === s ? "border-ink bg-ink text-ivory" : "border-sand bg-white hover:border-ink")}>{s}</button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>Availability</legend>
        <label className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose-dark" checked={!!params.inStock} onChange={() => toggle("inStock", true)} /> In stock only</label>
        <label className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose-dark" checked={!!params.onSale} onChange={() => toggle("onSale", true)} /> On sale</label>
      </fieldset>

      {chips.length > 0 && <button type="button" onClick={clearAll} className="text-sm underline underline-offset-4 hover:text-rose-dark">Clear all filters</button>}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
      <aside className={clsx(open ? "fixed inset-0 z-50 overflow-y-auto bg-ivory p-6" : "hidden", "lg:static lg:z-auto lg:block lg:overflow-visible lg:bg-transparent lg:p-0")} aria-label="Filters">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <h2 className="font-display text-3xl">Filters</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="p-2"><X className="h-6 w-6" /></button>
        </div>
        {filters}
        <button type="button" onClick={() => setOpen(false)} className="mt-8 h-12 w-full bg-ink text-sm uppercase tracking-widest text-ivory lg:hidden">Show {total} result{total === 1 ? "" : "s"}</button>
      </aside>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
          <p className="text-sm text-stone" role="status" aria-live="polite">{total} product{total === 1 ? "" : "s"}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 border border-ink px-4 text-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters{chips.length > 0 && ` (${chips.length})`}</button>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only">Sort by</span>
              <select value={params.sort ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? undefined : (e.target.value as ProductSort) })} className="h-10 border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <div className="hidden sm:flex" role="group" aria-label="Layout">
              <button type="button" aria-pressed={params.view !== "list"} aria-label="Grid view" onClick={() => update({ view: undefined })} className={clsx("h-10 w-10 border border-sand", params.view !== "list" && "bg-ink text-ivory")}><LayoutGrid className="mx-auto h-4 w-4" /></button>
              <button type="button" aria-pressed={params.view === "list"} aria-label="List view" onClick={() => update({ view: "list" })} className={clsx("h-10 w-10 border border-l-0 border-sand", params.view === "list" && "bg-ink text-ivory")}><List className="mx-auto h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <ul className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">
            {chips.map((c) => (
              <li key={c.label}>
                <button type="button" onClick={() => update(c.clear)} className="inline-flex items-center gap-1.5 bg-sand/70 px-3 py-1.5 text-xs hover:bg-sand">{c.label} <X className="h-3 w-3" aria-label="Remove filter" /></button>
              </li>
            ))}
          </ul>
        )}

        <div className={clsx("transition-opacity", pending && "opacity-50")} aria-busy={pending}>{children}</div>
      </div>
    </div>
  );
}
