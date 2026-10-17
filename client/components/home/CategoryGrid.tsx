import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h2 id="categories-heading" className="mb-8 font-display text-4xl sm:text-5xl">Shop by category</h2>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {categories.slice(0, 6).map((c) => (
          <li key={c._id}>
            <Link href={`/category/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width: 1024px) 16vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" />}
              </div>
              <p className="mt-3 text-center text-sm uppercase tracking-widest group-hover:text-rose-dark">{c.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
