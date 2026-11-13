import type { Metadata } from "next";
import { TrackOrder } from "@/components/track/TrackOrder";

export const metadata: Metadata = { title: "Track your order", description: "Follow your order with your order number and phone number. No account needed.", robots: { index: false } };

export default function TrackOrderPage() {
  return <TrackOrder />;
}
