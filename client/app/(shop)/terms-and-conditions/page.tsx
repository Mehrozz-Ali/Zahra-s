import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { POLICY_UPDATED } from "@/lib/policies";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: `The terms that apply when you shop at ${SITE.name}.`,
  alternates: { canonical: "/terms-and-conditions" },
};

// TODO before launch: have this reviewed by a lawyer and add your registered business name and address.
export default function Page() {
  return (
    <PolicyPage
      title="Terms and conditions" updated={POLICY_UPDATED}
      intro={`By using this website and placing an order with ${SITE.name} you agree to these terms. Please read them with our shipping and return policies.`}
      sections={[
        { heading: "Using the website", body: <p>You must give accurate information and keep your password private. You are responsible for what happens under your account. We may close accounts that are used for fraud or abuse.</p> },
        { heading: "Products and prices", body: <p>We try to show colours and sizes accurately, but screens differ, so a colour may look slightly different in person. All prices are in Pakistani rupees. We can correct a price or description error, and if that happens to an order you placed we will contact you before going ahead.</p> },
        { heading: "Placing an order", body: <p>Placing an order is an offer to buy. It is accepted when we confirm it. We may decline or cancel an order, for example if an item is out of stock or the details cannot be verified. If we cancel a paid order you are refunded in full.</p> },
        { heading: "Payment", body: <p>You can pay by card online or with cash on delivery. Card payments are processed securely by Stripe. For cash on delivery, payment is due in full to the courier when the parcel is delivered.</p> },
        { heading: "Delivery and returns", body: <p>Delivery is covered in our <Link href="/shipping-policy">shipping policy</Link> and returns in our <Link href="/return-policy">return policy</Link>. Both form part of these terms.</p> },
        { heading: "Reviews and content", body: <p>Reviews must be honest and based on your own experience, and must not be abusive or contain private information. We may remove reviews that break these rules.</p> },
        { heading: "Our content", body: <p>The text, images and designs on this website belong to {SITE.name} or its licensors. Please do not copy or reuse them without our permission.</p> },
        { heading: "Liability", body: <p>We take care to supply products as described. To the extent the law allows, we are not liable for indirect losses, and our liability for an order is limited to the amount you paid for it. Nothing here limits your rights under Pakistani consumer law.</p> },
        { heading: "Changes and governing law", body: <p>We may update these terms and will change the date at the top of this page. Orders are governed by the terms in force when you placed them. These terms are governed by the laws of Pakistan.</p> },
        { heading: "Contact", body: <p>Write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call {SITE.phone}.</p> },
      ]}
    />
  );
}
