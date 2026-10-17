import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetails } from "@/components/products/ProductDetails";
import { ProductGallery } from "@/components/products/ProductGallery";
import { PurchasePanel } from "@/components/products/PurchasePanel";
import { RatingStars } from "@/components/products/RatingStars";
import { RecentlyViewed } from "@/components/products/RecentlyViewed";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { getProduct, getRelatedProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  const description = (product.shortDescription ?? product.description ?? "").slice(0, 160);
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const url = `/product/${product.slug}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: product.name, description, url, type: "website", images: image ? [{ url: image.url }] : undefined },
    twitter: { card: "summary_large_image", title: product.name, description, images: image ? [image.url] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, related] = await Promise.all([getProduct(slug), getRelatedProducts(slug)]);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: { "@type": "Offer", url: absoluteUrl(`/product/${product.slug}`), priceCurrency: "PKR", price: product.finalPrice, availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    aggregateRating: product.numReviews > 0 ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.numReviews } : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={jsonLd} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: product.category.name, item: absoluteUrl(`/category/${product.category.slug}`) },
        { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/product/${product.slug}`) },
      ] }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/category/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <div className="space-y-5">
          <h1 className="font-display text-4xl sm:text-5xl">{product.name}</h1>
          <RatingStars rating={product.rating} count={product.numReviews} />
          <p className="flex flex-wrap items-center gap-3 text-2xl">
            <span className="font-medium">{formatPrice(product.finalPrice)}</span>
            {product.discountPrice !== undefined && (
              <>
                <span className="text-lg text-stone line-through">{formatPrice(product.price)}</span>
                <span className="bg-rose-dark px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-ivory">Save {product.discountPercentage}%</span>
              </>
            )}
          </p>
          {product.shortDescription && <p className="text-stone">{product.shortDescription}</p>}
          <PurchasePanel product={product} />
          <ProductDetails product={product} />
        </div>
      </div>

      <ProductReviews productId={product._id} rating={product.rating} numReviews={product.numReviews} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-sand py-12">
          <h2 id="related-heading" className="mb-8 font-display text-4xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{related.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </section>
      )}
      <RecentlyViewed currentSlug={product.slug} />
    </div>
  );
}
