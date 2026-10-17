import type { Metadata } from "next";
import Link from "next/link";
import { BrandStory } from "@/components/home/BrandStory";
import { Hero } from "@/components/home/Hero";
import { HeroSlider } from "@/components/home/HeroSlider";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ProductSection } from "@/components/home/ProductSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { SocialSection } from "@/components/home/SocialSection";
import { getBanners, getLatestReviews, getProducts } from "@/lib/data";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: { absolute: `${SITE.name} | ${SITE.tagline}` }, alternates: { canonical: "/" } };

export default async function HomePage() {
  const [banners, newArrivals, featured, bestSellers, trending, latestReviews] = await Promise.all([
    getBanners(),
    getProducts({ newArrival: true, limit: 8 }),
    getProducts({ featured: true, limit: 4 }),
    getProducts({ bestSeller: true, limit: 4 }),
    getProducts({ sort: "best-selling", limit: 4 }),
    getLatestReviews(6),
  ]);
  const hasProducts = [newArrivals, featured, bestSellers, trending].some((list) => list.length > 0);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", name: SITE.name, url: absoluteUrl("/"), email: SITE.email, telephone: SITE.phone, sameAs: [SITE.instagramUrl, SITE.facebookUrl] },
          { "@type": "WebSite", name: SITE.name, url: absoluteUrl("/"), potentialAction: { "@type": "SearchAction", target: `${absoluteUrl("/shop")}?q={search_term_string}`, "query-input": "required name=search_term_string" } },
        ],
      }} />
      {banners.length > 0 ? <HeroSlider banners={banners} /> : <Hero product={featured[0] ?? newArrivals[0]} />}
      <ProductSection title="New arrivals" eyebrow="Just in" href="/category/new-arrivals" products={newArrivals} />
      <ProductSection title="Featured collection" eyebrow="Our picks" href="/shop?featured=true" products={featured} tinted />
      <ProductSection title="Best sellers" eyebrow="Loved by customers" href="/shop?sort=best-selling" products={bestSellers} />
      <PromoBanner />
      <ProductSection title="Trending now" href="/shop?sort=best-selling" products={trending} />
      {!hasProducts && (
        <section className="mx-auto max-w-xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl">Our collection is on its way</h2>
          <p className="mb-6 mt-2 text-stone">New styles are being added. Please check back soon.</p>
          <Link href="/shop" className="underline underline-offset-4">Browse the shop</Link>
        </section>
      )}
      <BrandStory />
      <ReviewsSection reviews={latestReviews} />
      <NewsletterSection />
      <SocialSection />
    </>
  );
}
