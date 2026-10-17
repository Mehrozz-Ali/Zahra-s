import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/ShopView";
import { getCategory } from "@/lib/data";
import { SITE } from "@/lib/site";
import { parseShopParams, type RawParams } from "@/lib/shopParams";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return { title: "Category not found", robots: { index: false } };
  const description = category.description ?? `Shop ${category.name} from ${SITE.name}.`;
  const url = `/category/${category.slug}`;
  // Filters and sorting live in the query string; the canonical points at the plain category so they are not indexed as separate pages
  return { title: category.name, description, alternates: { canonical: url }, openGraph: { title: category.name, description, url, images: category.image ? [{ url: category.image.url }] : undefined } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return <ShopView params={parseShopParams(await searchParams)} basePath={`/category/${slug}`} heading={category.name} description={category.description} fixedCategory={slug} />;
}
