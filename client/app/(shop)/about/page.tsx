import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `${SITE.name} is a Pakistani women's clothing brand: comfortable fabrics, careful finishing, honest prices and delivery across the country.`,
  alternates: { canonical: "/about" },
};

// TODO before launch: replace the story below with your own.
export default function AboutPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", name: `About ${SITE.name}`, url: absoluteUrl("/about") }} />
      <PolicyPage
        title="About us"
        intro={<>
          <p>{SITE.name} brings together comfortable fabrics, careful finishing and designs that suit everyday life and special occasions. We started with a simple idea: women should be able to buy beautiful, well-made clothing online and trust that what arrives matches what they saw.</p>
          <p>Today we deliver across Pakistan, with cash on delivery, so you only pay when your order reaches your door.</p>
        </>}
        sections={[
          { heading: "Fabric first", body: <p>We choose soft, breathable fabrics suited to Pakistan's seasons, from light summer lawn to warm winter khaddar.</p> },
          { heading: "Careful finishing", body: <p>Every piece is checked for stitching, colour and fit before it is packed.</p> },
          { heading: "Honest pricing", body: <p>Clear prices, no hidden charges, and free delivery on orders over Rs. {SITE.freeShippingOver.toLocaleString("en-PK")}.</p> },
          { heading: "Easy returns", body: <p>If it is not right, you have {SITE.returnDays} days to send it back. Read our <Link href="/refund-policy">refund and exchange policy</Link>.</p> },
          { heading: "Have a question?", body: <p>We are happy to help with sizing, orders or anything else. <Link href="/contact">Contact us</Link> or <Link href="/shop">start shopping</Link>.</p> },
        ]}
      />
    </>
  );
}
