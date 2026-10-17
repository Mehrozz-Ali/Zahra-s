import type { Metadata } from "next";
import { ShopView } from "@/components/shop/ShopView";
import { parseShopParams, type RawParams } from "@/lib/shopParams";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse all women's clothing: lawn, winter wear, formal and more.",
  alternates: { canonical: "/shop" }, // filtered and sorted views are not separate pages for search engines
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = parseShopParams(await searchParams);
  return <ShopView params={params} basePath="/shop" heading={params.q ? `Results for "${params.q}"` : "All clothing"} />;
}
