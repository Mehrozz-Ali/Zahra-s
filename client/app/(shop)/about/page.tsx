import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `${SITE.name} is a Pakistani women's clothing brand: comfortable fabrics, careful finishing, honest prices and delivery across the country.`,
  alternates: { canonical: "/about" },
};

const VALUES = [
  { title: "Fabric first", text: "We choose soft, breathable fabrics suited to Pakistan's seasons, from light summer lawn to warm winter khaddar." },
  { title: "Careful finishing", text: "Every piece is checked for stitching, colour and fit before it is packed." },
  { title: "Honest pricing", text: "Clear prices, no hidden charges, and free delivery on orders over Rs. " + SITE.freeShippingOver.toLocaleString("en-PK") + "." },
  { title: "Easy returns", text: `If it is not right, you have ${SITE.returnDays} days to send it back.` },
];

// TODO before launch: replace the story below with your own.
export default function AboutPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", name: `About ${SITE.name}`, url: absoluteUrl("/about") }} />
      <article className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-dark">About us</p>
        <h1 className="font-display text-5xl sm:text-6xl">Clothing made for the way you live</h1>
        <p className="mt-6 text-lg leading-relaxed text-stone">
          {SITE.name} brings together comfortable fabrics, careful finishing and designs that suit everyday life and special occasions. We started with a simple idea: women should be able to buy beautiful, well-made clothing online and trust that what arrives matches what they saw.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-stone">
          Today we deliver across Pakistan, with cash on delivery, so you only pay when your order reaches your door.
        </p>
      </article>

      <section aria-labelledby="values" className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 id="values" className="mb-8 text-center font-display text-4xl">What we care about</h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <li key={v.title} className="border border-sand p-6">
                <h3 className="font-display text-2xl">{v.title}</h3>
                <p className="mt-2 text-stone">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <h2 className="font-display text-4xl">Have a question?</h2>
        <p className="mb-6 mt-2 text-stone">We are happy to help with sizing, orders or anything else.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Shop now</Link>
          <Link href="/contact" className="border border-ink px-8 py-3.5 text-sm uppercase tracking-widest hover:bg-ink hover:text-ivory">Contact us</Link>
        </div>
      </section>
    </>
  );
}
