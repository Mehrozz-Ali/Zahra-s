import Link from "next/link";
import { SITE } from "@/lib/site";

export function PromoBanner() {
  return (
    <section aria-label="Delivery offer" className="bg-ink text-ivory">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-14 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl">Free delivery over Rs. {SITE.freeShippingOver.toLocaleString("en-PK")}</h2>
          <p className="mt-2 text-ivory/70">Pay on delivery anywhere in Pakistan. Easy returns.</p>
        </div>
        <Link href="/shop" className="shrink-0 bg-rose px-8 py-3.5 text-sm uppercase tracking-widest text-ink transition-colors hover:bg-ivory">Start shopping</Link>
      </div>
    </section>
  );
}
