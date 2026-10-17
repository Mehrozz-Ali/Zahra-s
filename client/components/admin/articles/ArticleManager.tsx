"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DebouncedInput } from "@/components/shop/DebouncedInput";
import { STATUS_OPTIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { useGetAdminCategoriesQuery } from "@/services/categoryApi";
import { useDeleteProductMutation, useGetAdminProductsQuery, useUpdateProductMutation } from "@/services/productApi";
import type { Product, ProductStatus } from "@/types";
import { IconAction } from "@/components/ui/IconAction";

const STATUS_STYLE: Record<ProductStatus, string> = {
  active: "bg-green-50 text-green-900", draft: "bg-stone/10 text-stone", out_of_stock: "bg-amber-50 text-amber-900", archived: "bg-red-50 text-red-900",
};
const statusLabel = (s: ProductStatus) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
const select = "h-10 border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark";
const SAVED_TEXT = { published: "was published and is now live in the store", saved: "was saved", updated: "was updated" } as const;

export function ArticleManager() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState<"all" | "low" | "out">("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // After "Publish Article" the form sends the admin here with ?saved=<name>&mode=...; show it once, then tidy the URL
  useEffect(() => {
    const saved = params.get("saved");
    if (!saved) return;
    const mode = (params.get("mode") ?? "saved") as keyof typeof SAVED_TEXT;
    setMessage({ ok: true, text: `"${saved}" ${SAVED_TEXT[mode] ?? SAVED_TEXT.saved}.` });
    router.replace("/admin/articles");
  }, [params, router]);

  const { data: categories } = useGetAdminCategoriesQuery();
  const { data, isLoading, isFetching, error, refetch } = useGetAdminProductsQuery(
    { page, limit: 15, ...(q && { q }), ...(category && { category }), ...(status && { status: status as ProductStatus }), stock },
    { refetchOnMountOrArgChange: true },
  );
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const run = async (action: () => Promise<string>) => {
    setMessage(null);
    try { setMessage({ ok: true, text: await action() }); } catch (e) { setMessage({ ok: false, text: getErrorMessage(e) }); }
  };

  const archive = (p: Product) => window.confirm(`Archive "${p.name}"? It will be hidden from the store, and you can restore it later.`) &&
    run(async () => (await deleteProduct({ id: p._id }).unwrap(), `"${p.name}" was archived.`));
  const restore = (p: Product) => run(async () => (await updateProduct({ id: p._id, changes: { status: "draft" } }).unwrap(), `"${p.name}" was restored as a draft. Edit it to make it active.`));
  const destroy = (p: Product) => window.confirm(`Permanently delete "${p.name}"? This cannot be undone.`) &&
    run(async () => (await deleteProduct({ id: p._id, permanent: true }).unwrap(), `"${p.name}" was deleted.`));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-5xl">Article management</h1><p className="text-sm text-stone">Everything you publish here appears in the store according to its status.</p></div>
        <Link href="/admin/articles/create" className="bg-ink px-6 py-3 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">+ Add new article</Link>
      </div>

      {message && <p role={message.ok ? "status" : "alert"} className={clsx("flex items-start justify-between gap-4 p-3 text-sm", message.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800")}>{message.text}<button type="button" onClick={() => setMessage(null)} className="shrink-0 underline underline-offset-4">Dismiss</button></p>}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><label htmlFor="article-search" className="block text-xs text-stone">Search articles</label>
          <DebouncedInput id="article-search" type="search" value={q} onCommit={reset(setQ)} placeholder="Name or SKU" className={`${select} w-56`} /></div>
        <div className="space-y-1"><label htmlFor="f-category" className="block text-xs text-stone">Category</label>
          <select id="f-category" value={category} onChange={(e) => reset(setCategory)(e.target.value)} className={select}><option value="">All</option>{(categories ?? []).map((c) => <option key={c._id} value={c._id}>{c.name}{c.isArchived ? " (archived)" : ""}</option>)}</select></div>
        <div className="space-y-1"><label htmlFor="f-status" className="block text-xs text-stone">Status</label>
          <select id="f-status" value={status} onChange={(e) => reset(setStatus)(e.target.value)} className={select}><option value="">All</option>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div className="space-y-1"><label htmlFor="f-stock" className="block text-xs text-stone">Stock</label>
          <select id="f-stock" value={stock} onChange={(e) => reset(setStock)(e.target.value as typeof stock)} className={select}><option value="all">All</option><option value="low">Low stock</option><option value="out">Sold out</option></select></div>
      </div>

      {isLoading ? <div role="status" aria-label="Loading articles" className="h-64 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Articles could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.products.length === 0 ? (
        <div className="border border-sand bg-white p-10 text-center">
          <p className="text-stone">{q || category || status || stock !== "all" ? "No articles match these filters." : "No articles yet."}</p>
          {!(q || category || status || stock !== "all") && <Link href="/admin/articles/create" className="mt-3 inline-block underline underline-offset-4">Add your first article</Link>}
        </div>
      ) : (
        <div className={clsx("relative overflow-x-auto border border-sand bg-white", isFetching && "opacity-70")}>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead><tr className="border-b border-sand text-stone">
              {["Image", "Article name", "Category", "Price", "Stock", "Status", "Actions"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-normal">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.products.map((p) => {
                const img = (p.images.find((i) => i.isPrimary) ?? p.images[0])?.url;
                return (
                  <tr key={p._id} className="border-b border-sand/60 align-middle last:border-0">
                    <td className="px-4 py-3"><span className="relative block h-16 w-12 overflow-hidden bg-sand">{img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}</span></td>
                    <th scope="row" className="px-4 py-3 font-medium"><Link href={`/admin/articles/${p._id}/edit`} className="hover:text-rose-dark">{p.name}</Link><span className="block text-xs font-normal text-stone">{p.sku}</span></th>
                    <td className="px-4 py-3">{p.category?.name ?? "-"}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPrice(p.finalPrice)}{p.discountPrice ? <span className="block text-xs text-stone line-through">{formatPrice(p.price)}</span> : null}</td>
                    <td className="px-4 py-3 tabular-nums">{p.totalStock === 0 ? <span className="text-red-800">Sold out</span> : p.totalStock <= 5 ? <span className="text-amber-900">{p.totalStock} (low)</span> : p.totalStock}</td>
                    <td className="px-4 py-3"><span className={clsx("inline-block px-2 py-0.5 text-xs font-medium", STATUS_STYLE[p.status])}>{statusLabel(p.status)}</span></td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.status === "active" || p.status === "out_of_stock"
                          ? <IconAction icon="view" label={`View ${p.name} in the store`} href={`/product/${p.slug}`} target="_blank" />
                          : <IconAction icon="view" label="Only active articles are visible in the store" disabled />}
                        <IconAction icon="edit" label={`Edit ${p.name}`} href={`/admin/articles/${p._id}/edit`} />
                        {p.status === "archived" ? (
                          <>
                            <IconAction icon="restore" label={`Restore ${p.name}`} onClick={() => restore(p)} />
                            <IconAction icon="delete" tone="danger" label={`Delete ${p.name}`} onClick={() => destroy(p)} />
                          </>
                        ) : <IconAction icon="archive" tone="danger" label={`Archive ${p.name}`} onClick={() => archive(p)} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <nav aria-label="Article pages" className="flex items-center gap-4 text-sm">
          <button type="button" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Previous</button>
          <span className="text-stone">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} articles)</span>
          <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
