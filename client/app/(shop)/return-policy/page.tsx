import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { POLICY_UPDATED } from "@/lib/policies";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Return policy",
  description: `Return and exchange conditions for orders from ${SITE.name}: ${SITE.returnDays} days to return unworn items.`,
  alternates: { canonical: "/return-policy" },
};

// TODO before launch: have this reviewed so it matches what you are able to offer.
export default function Page() {
  return (
    <PolicyPage
      title="Return policy" updated={POLICY_UPDATED}
      intro={`We want you to love what you ordered. If it is not right, you have ${SITE.returnDays} days after delivery to ask for a return or exchange.`}
      sections={[
        { heading: "What can be returned", body: <>
          <p>Items can be returned within {SITE.returnDays} days of delivery if they are:</p>
          <ul><li>unworn, unwashed and unaltered</li><li>in their original condition with tags and packaging</li></ul>
          <p>For hygiene and fit reasons we cannot accept returns of items that were stitched to your measurements, or marked as final sale on the product page.</p></> },
        { heading: "Wrong or damaged items", body: <p>If you received the wrong item, or it arrived damaged or with a fault, write to us within 48 hours of delivery with your order number and a photo. We will replace it or refund you, and we cover the return courier cost.</p> },
        { heading: "How to start a return", body: <ol className="list-inside list-decimal space-y-1"><li>Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call {SITE.phone} with your order number and the items you want to return.</li><li>We confirm whether the return is accepted and tell you where to send it.</li><li>Pack the items securely and send them back with the courier we suggest.</li></ol> },
        { heading: "Refunds", body: <>
          <p>Once we receive and check your return, we refund the item price. Card payments go back to the same card, which can take 5 to 10 working days to appear on your statement. For cash on delivery orders we refund by bank transfer or mobile wallet, and we will ask for the details.</p>
          <p>Delivery charges are refunded only when the return is our mistake.</p></> },
        { heading: "Exchanges", body: <p>Need a different size or colour? Tell us when you contact us and we will exchange it if stock allows. If it is not in stock we refund you instead.</p> },
        { heading: "Cancelling an order", body: <p>You can cancel an order yourself from <Link href="/account/orders">My orders</Link> while it is still pending. After it is confirmed, contact us and we will cancel it if it has not shipped yet. Paid card orders that we cancel are refunded automatically.</p> },
      ]}
    />
  );
}
