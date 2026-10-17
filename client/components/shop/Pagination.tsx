import clsx from "clsx";
import Link from "next/link";
import { withQuery, type ShopParams } from "@/lib/shopParams";
import type { PaginationMeta } from "@/types";

export function Pagination({ pagination, basePath, params }: { pagination: PaginationMeta; basePath: string; params: ShopParams }) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const href = (p: number) => withQuery(basePath, { ...params, page: p > 1 ? p : undefined });
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const box = "inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {pagination.hasPrev ? <Link href={href(page - 1)} rel="prev" className={clsx(box, "border-sand hover:border-ink")}>Previous</Link> : <span aria-disabled className={clsx(box, "border-sand text-stone/50")}>Previous</span>}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - (pages[i - 1] ?? 0) > 1 && <span aria-hidden className="px-1 text-stone">...</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} aria-label={`Page ${p}`} className={clsx(box, p === page ? "border-ink bg-ink text-ivory" : "border-sand hover:border-ink")}>{p}</Link>
        </span>
      ))}
      {pagination.hasNext ? <Link href={href(page + 1)} rel="next" className={clsx(box, "border-sand hover:border-ink")}>Next</Link> : <span aria-disabled className={clsx(box, "border-sand text-stone/50")}>Next</span>}
    </nav>
  );
}
