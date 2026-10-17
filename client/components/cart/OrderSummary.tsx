import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CartSummary } from "@/types";

interface OrderSummaryProps {
  summary: CartSummary | undefined;
  updating: boolean;
  canCheckout: boolean;
}

export function OrderSummary({ summary, updating, canCheckout }: OrderSummaryProps) {
  const row = "flex justify-between py-1.5";
  return (
    <aside aria-labelledby="summary-heading" className="h-fit border border-sand bg-white p-6 lg:sticky lg:top-24">
      <h2 id="summary-heading" className="mb-4 font-display text-3xl">Order summary</h2>
      {!summary ? (
        <p className="text-sm text-stone">Calculating...</p>
      ) : (
        <dl className={updating ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={updating}>
          <div className={row}><dt className="text-stone">Subtotal</dt><dd>{formatPrice(summary.subtotal)}</dd></div>
          {summary.discount > 0 && <div className={row}><dt className="text-stone">Discount</dt><dd className="text-green-800">-{formatPrice(summary.discount)}</dd></div>}
          <div className={row}><dt className="text-stone">Shipping</dt><dd>{summary.shippingCost === 0 ? "Free" : formatPrice(summary.shippingCost)}</dd></div>
          {summary.tax > 0 && <div className={row}><dt className="text-stone">Tax</dt><dd>{formatPrice(summary.tax)}</dd></div>}
          <div className="mt-2 flex justify-between border-t border-sand pt-4 text-lg font-medium"><dt>Total</dt><dd>{formatPrice(summary.total)}</dd></div>
          {summary.amountToFreeShipping > 0 && (
            <p className="mt-4 bg-sand/50 p-3 text-sm">Add {formatPrice(summary.amountToFreeShipping)} more to get free delivery.</p>
          )}
        </dl>
      )}
      {canCheckout ? (
        <Link href="/checkout" className="mt-6 block bg-ink py-3.5 text-center text-sm font-medium uppercase tracking-widest text-ivory transition-colors hover:bg-rose-dark">Proceed to checkout</Link>
      ) : (
        <span aria-disabled="true" className="mt-6 block cursor-not-allowed bg-ink/40 py-3.5 text-center text-sm font-medium uppercase tracking-widest text-ivory">Proceed to checkout</span>
      )}
      <p className="mt-3 text-center text-xs text-stone">Cash on delivery available</p>
    </aside>
  );
}
