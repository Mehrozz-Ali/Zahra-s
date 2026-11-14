import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { POLICY_UPDATED } from "@/lib/policies";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund and exchange policy",
  description: `How returns, exchanges and refunds work for cash on delivery orders from ${SITE.name}.`,
  alternates: { canonical: "/refund-policy" },
};

// TODO before launch: have this reviewed so it matches what you are able to offer (days, who pays the courier, refund method).
export default function Page() {
  return (
    <PolicyPage
      title="Refund and exchange policy" updated={POLICY_UPDATED}
      intro={`Every order is cash on delivery. This page explains how returns, exchanges and refunds work, step by step. It goes together with our return policy.`}
      sections={[
        { heading: "Checking your parcel", body: <>
          <p>You can return a parcel only after you have paid the courier and received it. Please do not ask the delivery person to open the package before you pay; couriers in Pakistan do not allow this for cash on delivery orders.</p>
          <p>If something is wrong, tell us after you receive the parcel and we will sort it out, following the steps below.</p></> },
        { heading: "Exchange within " + SITE.returnDays + " days", body: <>
          <p>If you are not satisfied with an item, you can ask for an exchange within <strong>{SITE.returnDays} days</strong> of delivery. We process it within {SITE.returnDays} days of receiving the item back.</p>
          <ul><li>The item must be unworn, unwashed, undamaged and unused, with the original tags attached.</li><li>An exchange depends on the stock we have at that moment. If your size or design is not available, we refund you instead.</li></ul></> },
        { heading: "Who pays the courier", body: <>
          <p>If the item is faulty or we sent the wrong one, we pay the courier charges both ways.</p>
          <p>If you return or exchange an item that is not faulty (for example you changed your mind or the size is not right), the courier charges for sending it back are paid by you.</p></> },
        { heading: "Exchange or return procedure", body: <ol className="list-inside list-decimal space-y-1">
          <li>Take a clear photo of the item, and of the fault if there is one.</li>
          <li>Pack the item back in its original packing.</li>
          <li>Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, or call {SITE.phone}, with your order number, the photo, and whether you want a return or an exchange.</li>
          <li>We reply with the address to send the parcel to.</li>
          <li>Send it with your local courier and share the tracking number with us.</li>
          <li>When we receive it, we process your exchange or refund.</li></ol> },
        { heading: "Refunds", body: <>
          <p>When a refund is due, we send it by bank transfer or mobile wallet and ask you for the details. It is paid after we receive and check the returned item.</p>
          <p>Delivery charges are refunded only when the return is our mistake. More about eligibility is in our <Link href="/return-policy">return policy</Link>.</p></> },
        { heading: "Colour and photos", body: <>
          <p>We photograph our suits carefully, but there can be a slight difference in shade and colour between the photo and the real fabric because of studio lighting and your screen.</p>
          <p>For this reason, a suit can be exchanged only if it is faulty or the wrong item, not because of a small shade difference.</p></> },
      ]}
    />
  );
}
