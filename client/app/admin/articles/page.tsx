import type { Metadata } from "next";
import { Suspense } from "react";
import { ArticleManager } from "@/components/admin/articles/ArticleManager";

export const metadata: Metadata = { title: "Articles" };

export default function AdminArticlesPage() {
  // ArticleManager reads the URL (the "saved" message after publishing), which needs a Suspense boundary
  return <Suspense fallback={<div role="status" aria-label="Loading" className="h-64 animate-pulse bg-sand/60" />}><ArticleManager /></Suspense>;
}
