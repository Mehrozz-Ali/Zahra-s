import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { POLICY_UPDATED } from "@/lib/policies";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: `Delivery times, charges and how orders are shipped across Pakistan by ${SITE.name}.`,
  alternates: { canonical: "/shipping-policy" },
};

// TODO before launch: have this reviewed so it matches how you really ship.
export default function Page() {
  return (
    <PolicyPage
      title="Shipping policy" updated={POLICY_UPDATED}
      intro={`We deliver across Pakistan. This page explains how long delivery takes, what it costs and what happens when your parcel arrives.`}
      sections={[
        { heading: "Where we deliver", body: <p>We ship to addresses in all provinces and territories of Pakistan. If your area is hard for couriers to reach, we will contact you before dispatch.</p> },
        { heading: "Delivery time", body: <>
          <p>Standard delivery takes {SITE.deliveryTime}. Express delivery is offered at checkout for faster arrival in most cities, and its estimate is shown before you pay.</p>
          <p>These times start when your order is confirmed, not when it is placed, and exclude Sundays and public holidays. Busy periods such as Eid can add a few days.</p></> },
        { heading: "Delivery charges", body: <>
          <p>Standard delivery costs Rs. {SITE.shippingFee.toLocaleString("en-PK")}. It is free on orders over Rs. {SITE.freeShippingOver.toLocaleString("en-PK")}. The exact charge for each delivery option is shown at checkout before you place the order.</p></> },
        { heading: "Order processing", body: <p>Orders are packed and handed to the courier after they are confirmed. Cash on delivery orders are confirmed by us, and we may call you on the mobile number you gave if anything needs checking.</p> },
        { heading: "Tracking your order", body: <p>We email you when your order ships and again when it is delivered. You can also follow its progress any time under <Link href="/account/orders">My orders</Link>.</p> },
        { heading: "Cash on delivery", body: <p>Please keep the exact amount ready for the courier. A parcel can be refused only if you did not order it; see our <Link href="/return-policy">return policy</Link> for items you want to send back after delivery.</p> },
        { heading: "Delivery problems", body: <>
          <ul><li>Wrong address or phone number: contact us as soon as you notice, before the parcel ships.</li><li>Parcel damaged on arrival: take a photo and write to us within 48 hours.</li><li>Parcel not arrived after the estimated time: write to us with your order number.</li></ul>
          <p>You can reach us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or {SITE.phone}.</p></> },
      ]}
    />
  );
}
