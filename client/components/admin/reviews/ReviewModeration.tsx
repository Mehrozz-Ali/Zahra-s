"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { DebouncedInput } from "@/components/shop/DebouncedInput";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useAdminDeleteReviewMutation, useGetAdminReviewsQuery } from "@/services/reviewApi";
import { IconAction } from "@/components/ui/IconAction";

const field = "h-10 border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark";
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function ReviewModeration() {
  const [rating, setRating] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useGetAdminReviewsQuery({ page, ...(rating && { rating }), ...(q && { q }) }, { refetchOnMountOrArgChange: true });
  const [remove, { isLoading: deleting }] = useAdminDeleteReviewMutation();

  const del = async (id: string) => {
    if (!window.confirm("Delete this review? The product's average rating is recalculated. This cannot be undone.")) return;
    setMessage(null);
    try { await remove(id).unwrap(); setMessage({ ok: true, text: "Review deleted." }); }
    catch (e) { setMessage({ ok: false, text: getErrorMessage(e, "Could not delete the review.") }); }
  };

  const max = data ? Math.max(1, ...data.stats.distribution.map((d) => d.count)) : 1;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-5xl">Reviews</h1><p className="text-sm text-stone">Remove reviews that are abusive or spam. Ratings update automatically.</p></div>

      {data && (
        <section aria-label="Rating summary" className="grid gap-6 border border-sand bg-white p-5 sm:grid-cols-[auto_1fr]">
          <div><p className="font-display text-5xl tabular-nums">{data.stats.average.toFixed(1)}</p><p className="text-sm text-stone">{data.stats.total} review{data.stats.total === 1 ? "" : "s"} in total</p></div>
          <ul className="min-w-0 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = data.stats.distribution.find((d) => d.stars === s)?.count ?? 0;
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0">{s} star{s === 1 ? "" : "s"}</span>
                  <span className="h-2.5 min-w-0 flex-1 bg-sand" aria-hidden="true"><span className="block h-full bg-[#2a78d6]" style={{ width: `${(count / max) * 100}%` }} /></span>
                  <span className="w-8 shrink-0 text-right tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><label htmlFor="r-search" className="block text-xs text-stone">Search comments</label>
          <DebouncedInput id="r-search" type="search" value={q} onCommit={(v: string) => { setQ(v); setPage(1); }} placeholder="Words in the review" className={`${field} w-64`} /></div>
        <div className="space-y-1"><label htmlFor="r-rating" className="block text-xs text-stone">Rating</label>
          <select id="r-rating" value={rating} onChange={(e) => { setRating(Number(e.target.value)); setPage(1); }} className={field}><option value={0}>All ratings</option>{[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} star{s === 1 ? "" : "s"}</option>)}</select></div>
      </div>

      <div aria-live="polite">{message && <p role={message.ok ? "status" : "alert"} className={clsx("p-3 text-sm", message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>{message.text}</p>}</div>

      {isLoading ? <div role="status" aria-label="Loading reviews" className="h-64 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Reviews could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.reviews.length === 0 ? (
        <p className="border border-sand bg-white p-10 text-center text-stone">{q || rating ? "No reviews match these filters." : "No reviews yet. Customers can review articles they have received."}</p>
      ) : (
        <ul className={clsx("space-y-3", isFetching && "opacity-70")}>
          {data.reviews.map((r) => (
            <li key={r._id} className="border border-sand bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p><span role="img" aria-label={`${r.rating} out of 5 stars`} className="text-rose-dark">{stars(r.rating)}</span></p>
                  <p className="mt-1 text-sm text-stone">
                    {r.user ? `${r.user.name} (${r.user.email})` : "Deleted customer"} on {r.product ? <Link href={`/product/${r.product.slug}`} className="underline underline-offset-4 hover:text-rose-dark">{r.product.name}</Link> : "a removed article"} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <IconAction icon="delete" tone="danger" label={`Delete review by ${r.user?.name ?? "customer"}`} disabled={deleting} onClick={() => del(r._id)} />
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-sm">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {data && data.pagination.totalPages > 1 && (
        <nav aria-label="Review pages" className="flex items-center gap-4 text-sm">
          <button type="button" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Previous</button>
          <span className="text-stone">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
