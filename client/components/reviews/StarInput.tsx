"use client";

import { Star } from "lucide-react";

const LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

/** Radio group of five stars: works with the keyboard (arrow keys) and screen readers. */
export function StarInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-1">
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" aria-label={`${n} star${n > 1 ? "s" : ""}, ${LABELS[n - 1]}`} />
            <Star className={`h-7 w-7 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-rose-dark ${n <= value ? "fill-current text-rose" : "text-sand"}`} aria-hidden />
          </label>
        ))}
        {value > 0 && <span className="ml-2 text-sm text-stone">{LABELS[value - 1]}</span>}
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
    </fieldset>
  );
}
