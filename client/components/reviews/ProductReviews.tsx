"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RatingStars } from "@/components/products/RatingStars";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { useDeleteReviewMutation, useGetMyReviewStateQuery, useGetProductReviewsQuery } from "@/services/reviewApi";
import { ReviewForm } from "./ReviewForm";
import { Pencil, Trash2 } from "lucide-react";

const stars = (n: number) => (
  <span className="flex" role="img" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-current text-rose" : "text-sand"}`} aria-hidden />)}
  </span>
);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ProductReviews({ productId, rating, numReviews }: { productId: string; rating: number; numReviews: number }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // Login state only exists in the browser, so the personal block renders after mount to keep server and client HTML identical
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState("");
  const list = useGetProductReviewsQuery({ productId, page });
  const mine = useGetMyReviewStateQuery(productId, { skip: !isAuthenticated });
  const [deleteReview, { isLoading: deleting }] = useDeleteReviewMutation();

  const state = mine.data;
  const data = list.data;
  // Use live numbers once loaded, so a new review shows straight away
  const total = data?.pagination.total ?? numReviews;
  const average = data && data.pagination.total > 0 ? data.distribution.reduce((sum, d) => sum + d.stars * d.count, 0) / data.pagination.total : rating;

  const onDelete = async () => {
    if (!state?.review || !window.confirm("Delete your review?")) return;
    setActionError("");
    try {
      await deleteReview({ id: state.review._id, productId }).unwrap();
      setPage(1);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="border-t border-sand py-12">
      <h2 id="reviews-heading" className="mb-4 font-display text-4xl">Customer reviews</h2>
      <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
        <div>
          <RatingStars rating={average} count={total} />
          {data && total > 0 && (
            <ul className="mt-4 space-y-1.5" aria-label="Rating breakdown">
              {data.distribution.map(({ stars: s, count }) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span className="w-12 shrink-0">{s} star{s > 1 ? "s" : ""}</span>
                  <span className="h-2 flex-1 bg-sand" aria-hidden><span className="block h-full bg-rose" style={{ width: `${(count / total) * 100}%` }} /></span>
                  <span className="w-6 text-right text-stone">{count}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            {!mounted || authLoading || (isAuthenticated && mine.isLoading) ? null : !isAuthenticated ? (
              <p className="text-sm text-stone"><Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`} className="underline underline-offset-4">Log in</Link> to review items you have received.</p>
            ) : state?.review ? (
              !editing && (
                <div className="space-y-2 text-sm">
                  <p className="text-stone">You reviewed this item.</p>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-rose-dark"><Pencil className="h-4 w-4" aria-hidden />Edit</button>
                    <button type="button" onClick={onDelete} disabled={deleting} className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-rose-dark disabled:opacity-60"><Trash2 className="h-4 w-4" aria-hidden />{deleting ? "Deleting..." : "Delete"}</button>
                  </div>
                  {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
                </div>
              )
            ) : !state?.canReview ? (
              <p className="text-sm text-stone">Only customers whose order has been delivered can review this item.</p>
            ) : null}
          </div>
        </div>

        <div>
          {isAuthenticated && state?.canReview && <div className="mb-8"><ReviewForm productId={productId} onDone={() => setPage(1)} /></div>}
          {isAuthenticated && state?.review && editing && <div className="mb-8"><ReviewForm productId={productId} existing={state.review} onDone={() => setEditing(false)} /></div>}

          {list.isLoading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading reviews">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse bg-sand/60" />)}</div>
          ) : list.isError ? (
            <p role="alert" className="text-stone">We could not load reviews right now. <button type="button" onClick={() => list.refetch()} className="underline underline-offset-4">Try again</button></p>
          ) : data && data.reviews.length > 0 ? (
            <>
              <ul className="divide-y divide-sand">
                {data.reviews.map((r) => (
                  <li key={r._id} className="py-5 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">{stars(r.rating)}<span className="text-sm font-medium">{r.authorName}</span><span className="text-xs text-stone">{formatDate(r.createdAt)}{r.updatedAt !== r.createdAt ? " (edited)" : ""}</span></div>
                    <p className="mt-2 whitespace-pre-line break-words text-stone">{r.comment}</p>
                  </li>
                ))}
              </ul>
              {data.pagination.totalPages > 1 && (
                <nav aria-label="Review pages" className="mt-6 flex items-center gap-4 text-sm">
                  <button type="button" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Previous</button>
                  <span className="text-stone">Page {data.pagination.page} of {data.pagination.totalPages}</span>
                  <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Next</button>
                </nav>
              )}
            </>
          ) : (
            <p className="text-stone">No reviews yet. Be the first to share your thoughts once your order arrives.</p>
          )}
        </div>
      </div>
    </section>
  );
}
