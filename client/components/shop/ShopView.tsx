import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductRow } from "@/components/products/ProductRow";
import { getCategories, getProductFilters, getProductList } from "@/lib/data";
import { PAGE_SIZE, withQuery, type ShopParams } from "@/lib/shopParams";
import { Pagination } from "./Pagination";
import { ShopBrowser } from "./ShopBrowser";

interface ShopViewProps {
  params: ShopParams;
  basePath: string;
  heading: string;
  description?: string;
  fixedCategory?: string; // set on /category/[slug] pages, where the category comes from the path
}

export async function ShopView({ params, basePath, heading, description, fixedCategory }: ShopViewProps) {
  const { view, ...filters } = params;
  const category = fixedCategory ?? filters.category;
  const [result, facets, categories] = await Promise.all([
    getProductList({ ...filters, category, limit: PAGE_SIZE }),
    getProductFilters(category),
    fixedCategory ? Promise.resolve([]) : getCategories(),
  ]);
  const { category: _ignored, ...urlFilters } = params;
  const urlParams: ShopParams = fixedCategory ? urlFilters : params; // category is part of the path on category pages

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-5xl">{heading}</h1>
        {description && <p className="mt-2 max-w-2xl text-stone">{description}</p>}
      </header>

      {result === null ? (
        <div role="alert" className="border border-sand bg-white p-10 text-center">
          <p className="font-display text-3xl">We could not load the products</p>
          <p className="mb-5 mt-2 text-stone">Please check your connection and try again.</p>
          <Link href={withQuery(basePath, urlParams)} className="underline underline-offset-4">Try again</Link>
        </div>
      ) : (
        <ShopBrowser params={urlParams} basePath={basePath} facets={facets} categories={categories} total={result.pagination.total}>
          {result.products.length === 0 ? (
            <div className="border border-dashed border-sand p-12 text-center">
              <p className="font-display text-3xl">No products found</p>
              <p className="mb-5 mt-2 text-stone">Try removing a filter or searching for something else.</p>
              <Link href={basePath} className="underline underline-offset-4">Clear filters</Link>
            </div>
          ) : view === "list" ? (
            <div><h2 className="sr-only">Products</h2>{result.products.map((p) => <ProductRow key={p._id} product={p} />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              <h2 className="sr-only">Products</h2>
              {result.products.map((p, i) => <ProductCard key={p._id} product={p} priority={i < 3} />)}
            </div>
          )}
          <Pagination pagination={result.pagination} basePath={basePath} params={urlParams} />
        </ShopBrowser>
      )}
    </div>
  );
}
