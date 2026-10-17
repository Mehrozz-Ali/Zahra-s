import type { Metadata } from "next";
import { ReviewModeration } from "@/components/admin/reviews/ReviewModeration";

export const metadata: Metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return <ReviewModeration />;
}
