import { Star } from "lucide-react";
import Link from "next/link";
import type { LatestReview } from "@/types";

/** Renders nothing until real customer reviews exist. */
export function ReviewsSection({ reviews }: { reviews: LatestReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="home-reviews-heading" className="bg-sand/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="mb-1 text-xs uppercase tracking-widest text-rose-dark">Kind words</p>
        <h2 id="home-reviews-heading" className="mb-8 font-display text-4xl sm:text-5xl">Customer reviews</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <li key={r._id} className="flex flex-col bg-white p-6">
              <span className="flex" role="img" aria-label={`${r.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-current text-rose" : "text-sand"}`} aria-hidden />)}
              </span>
              <p className="mt-3 line-clamp-5 flex-1 text-stone">&ldquo;{r.comment}&rdquo;</p>
              <p className="mt-4 text-sm"><span className="font-medium">{r.authorName}</span> on <Link href={`/product/${r.productSlug}`} className="underline underline-offset-4 hover:text-rose-dark">{r.productName}</Link></p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
