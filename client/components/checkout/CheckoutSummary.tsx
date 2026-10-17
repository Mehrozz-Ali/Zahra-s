import Image from "next/image";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { AppliedCoupon, CartSummary, PricedLine } from "@/types";

interface CheckoutSummaryProps {
  items: PricedLine[];
  summary: CartSummary | undefined;
  coupon?: AppliedCoupon | null;
  couponSlot?: ReactNode; // the coupon box, so it sits in the summary
}

export function CheckoutSummary({ items, summary, coupon, couponSlot }: CheckoutSummaryProps) {
  const row = "flex justify-between py-1.5";
  return (
    <aside aria-labelledby="co-summary-heading" className="h-fit border border-sand bg-white p-6 lg:sticky lg:top-24">
      <h2 id="co-summary-heading" className="mb-4 font-display text-3xl">Your order</h2>
      <ul className="mb-4 space-y-3 border-b border-sand pb-4">
        {items.map((i) => (
          <li key={`${i.productId}|${i.size}`} className="flex gap-3 text-sm">
            <span className="relative block h-16 w-12 shrink-0 overflow-hidden bg-sand">{i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}</span>
            <span className="flex-1"><span className="line-clamp-1 font-medium">{i.name}</span><span className="block text-stone">Size {i.size} &times; {i.quantity}</span></span>
            <span>{formatPrice(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
      {couponSlot}
      {summary && (
        <dl>
          <div className={row}><dt className="text-stone">Subtotal</dt><dd>{formatPrice(summary.subtotal)}</dd></div>
          {summary.discount > 0 && <div className={row}><dt className="text-stone">Discount{coupon ? ` (${coupon.code})` : ""}</dt><dd className="text-green-800">-{formatPrice(summary.discount)}</dd></div>}
          <div className={row}><dt className="text-stone">Shipping</dt><dd>{summary.shippingCost === 0 ? "Free" : formatPrice(summary.shippingCost)}</dd></div>
          {summary.tax > 0 && <div className={row}><dt className="text-stone">Tax</dt><dd>{formatPrice(summary.tax)}</dd></div>}
          <div className="mt-2 flex justify-between border-t border-sand pt-4 text-lg font-medium"><dt>Total</dt><dd>{formatPrice(summary.total)}</dd></div>
        </dl>
      )}
    </aside>
  );
}
