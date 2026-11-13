"use client";

import Link from "next/link";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";
import { getErrorMessage } from "@/lib/errors";
import { useGetAdminProductQuery } from "@/services/productApi";

/** Loads the saved article, then shows the form filled with it. */
export function ArticleEditor({ id }: { id: string }) {
  const { data: product, isLoading, error, refetch } = useGetAdminProductQuery(id);
  if (isLoading) return <div role="status" aria-label="Loading article" className="h-96 animate-pulse bg-sand/60 motion-reduce:animate-none" />;
  if (error || !product) {
    const missing = typeof error === "object" && error !== null && "status" in error && error.status === 404;
    return (
      <div role="alert" className="bg-red-50 p-5 text-red-800">
        {missing ? "This article does not exist." : getErrorMessage(error, "The article could not be loaded.")}{" "}
        {missing ? <Link href="/admin/articles" className="ml-2 inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap border border-ink px-4 text-sm transition-colors hover:bg-ink hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink">Back to articles</Link> : <button type="button" onClick={() => refetch()} className="ml-2 inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap border border-ink px-4 text-sm transition-colors hover:bg-ink hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink">Try again</button>}
      </div>
    );
  }
  return <ArticleForm key={product.updatedAt} product={product} />;
}
