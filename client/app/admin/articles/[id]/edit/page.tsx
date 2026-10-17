import type { Metadata } from "next";
import { ArticleEditor } from "@/components/admin/articles/ArticleEditor";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleEditor id={id} />;
}
