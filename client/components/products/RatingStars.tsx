import { Star } from "lucide-react";

export function RatingStars({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return <p className="text-sm text-stone">No reviews yet</p>;
  return (
    <p className="flex items-center gap-2 text-sm">
      <span className="flex" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-current text-rose" : "text-sand"}`} aria-hidden />)}
      </span>
      <span className="text-stone">{rating.toFixed(1)} ({count} review{count === 1 ? "" : "s"})</span>
    </p>
  );
}
