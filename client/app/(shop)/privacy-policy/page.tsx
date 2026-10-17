import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { POLICY_UPDATED } from "@/lib/policies";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${SITE.name} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy-policy" },
};

// TODO before launch: have this reviewed by a lawyer. It describes what this website does today; update it if you add analytics, ads or other services.
export default function Page() {
  return (
    <PolicyPage
      title="Privacy policy" updated={POLICY_UPDATED}
      intro={`${SITE.name} respects your privacy. This page explains what we collect when you use our website, why, and the choices you have.`}
      sections={[
        { heading: "What we collect", body: <>
          <ul><li>Account details: your name, email address, mobile number and password. Passwords are stored in a scrambled form that we cannot read.</li><li>Delivery details: the addresses and phone numbers you give us for orders.</li><li>Order details: what you bought, when, how you paid and the status of your order.</li><li>Reviews and wishlist items you add.</li><li>Your email address if you subscribe to our newsletter.</li></ul>
          <p>We do not store your card number. Card payments are handled by Stripe.</p></> },
        { heading: "How we use it", body: <ul><li>To process and deliver your orders and keep you updated by email.</li><li>To manage your account, wishlist and saved cart.</li><li>To answer your questions and handle returns.</li><li>To keep the website secure and prevent fraud.</li><li>To send our newsletter, only if you subscribed. Every email lets you opt out.</li></ul> },
        { heading: "Who we share it with", body: <>
          <p>We share only what is needed with the companies that help us run the store:</p>
          <ul><li>Delivery couriers: your name, address and phone number.</li><li>Stripe: payment details, for card payments.</li><li>Our email provider: your email address, to send messages.</li><li>Our hosting and image providers.</li></ul>
          <p>We do not sell your personal information.</p></> },
        { heading: "Cookies and local storage", body: <p>We use a secure cookie to keep you logged in, and your browser&apos;s storage to remember your cart and recently viewed items on this device. We do not use advertising cookies.</p> },
        { heading: "How long we keep it", body: <p>We keep your account until you ask us to remove it. We keep order records for as long as needed for accounting, tax and returns.</p> },
        { heading: "Your choices", body: <>
          <p>You can view and change your details in your <Link href="/account/profile">profile</Link> and manage addresses under <Link href="/account/addresses">addresses</Link>. To ask for a copy of your data or for your account to be deleted, write to us.</p></> },
        { heading: "Security", body: <p>We protect your data with encrypted connections and restricted access. No system is perfectly secure, so please use a strong password and keep it private.</p> },
        { heading: "Contact", body: <p>Questions about privacy? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p> },
      ]}
    />
  );
}
