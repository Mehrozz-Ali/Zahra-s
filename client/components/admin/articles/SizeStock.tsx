"use client";

import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import type { ArticleFormInput } from "@/lib/validations/article";

interface Props {
  register: UseFormRegister<ArticleFormInput>;
  watch: UseFormWatch<ArticleFormInput>;
  errors: FieldErrors<ArticleFormInput>;
}

const input = "h-11 border border-sand bg-white px-3 text-base outline-none focus:border-rose-dark aria-[invalid=true]:border-red-700";

/** One stock box per selected size. An article is one design in one colour, so stock is only counted per size. */
export function SizeStock({ register, watch, errors }: Props) {
  const sizes = watch("sizes");
  const stock = watch("stock");
  const total = sizes.reduce((sum, size) => sum + (Number(stock?.[size]) || 0), 0);

  if (sizes.length === 0) return <p className="text-sm text-stone">Select at least one size above, then enter its stock.</p>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {sizes.map((size) => (
          <div key={size} className="space-y-1.5">
            <label htmlFor={`stock-${size}`} className="block text-sm">{size}</label>
            <input id={`stock-${size}`} type="number" inputMode="numeric" min={0} step={1} placeholder="0" aria-invalid={errors.stock?.[size] ? true : undefined} className={`${input} w-full`} {...register(`stock.${size}`)} />
            {errors.stock?.[size] && <p role="alert" className="text-xs text-red-700">{errors.stock[size]?.message}</p>}
          </div>
        ))}
      </div>
      <p className="text-sm text-stone">Total stock: <strong className="text-ink">{total}</strong></p>
    </div>
  );
}
