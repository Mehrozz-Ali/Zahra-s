import type { Metadata } from "next";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";

export const metadata: Metadata = { title: "Add article" };

export default function CreateArticlePage() {
  return <ArticleForm />;
}
