import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Contact ${SITE.name} about orders, sizing, deliveries and returns. Email ${SITE.email} or call ${SITE.phone}.`,
  alternates: { canonical: "/contact" },
};

const telHref = `tel:+92${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`;

export default function ContactPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", name: `Contact ${SITE.name}`, url: absoluteUrl("/contact") }} />
      <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-dark">Customer care</p>
        <h1 className="font-display text-5xl sm:text-6xl">Contact us</h1>
        <p className="mt-4 max-w-xl text-lg text-stone">Questions about an order, a size or a return? Write or call and we will help.</p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          <li className="border border-sand bg-white p-6">
            <h2 className="font-display text-2xl">Email</h2>
            <p className="mt-2"><a href={`mailto:${SITE.email}`} className="break-all underline underline-offset-4 hover:text-rose-dark">{SITE.email}</a></p>
            <p className="mt-1 text-sm text-stone">We reply within one working day.</p>
          </li>
          <li className="border border-sand bg-white p-6">
            <h2 className="font-display text-2xl">Phone</h2>
            <p className="mt-2"><a href={telHref} className="underline underline-offset-4 hover:text-rose-dark">{SITE.phone}</a></p>
            <p className="mt-1 text-sm text-stone">{SITE.hours}</p>
          </li>
        </ul>

        <section aria-labelledby="faq" className="mt-14">
          <h2 id="faq" className="mb-4 font-display text-3xl">Quick answers</h2>
          <dl className="divide-y divide-sand border-y border-sand">
            {[
              ["Where is my order?", <>Follow it under <Link href="/account/orders" className="underline underline-offset-4">My orders</Link>. We email you when it ships.</>],
              ["How long does delivery take?", <>Standard delivery takes {SITE.deliveryTime}. See the <Link href="/shipping-policy" className="underline underline-offset-4">shipping policy</Link>.</>],
              ["Can I return something?", <>Yes, within {SITE.returnDays} days if it is unworn. See the <Link href="/return-policy" className="underline underline-offset-4">return policy</Link>.</>],
              ["Which size should I order?", <>Each product page has a size guide with measurements.</>],
            ].map(([q, a]) => (
              <div key={String(q)} className="py-4"><dt className="font-medium">{q}</dt><dd className="mt-1 text-stone">{a}</dd></div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
