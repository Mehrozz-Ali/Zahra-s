import { SITE } from "@/lib/site";

export function BrandStory() {
  return (
    <section aria-labelledby="story-heading" className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-dark">Our story</p>
      <h2 id="story-heading" className="font-display text-4xl sm:text-5xl">Made for the way you dress</h2>
      {/* TODO before launch: replace with your own brand story */}
      <p className="mt-6 text-lg leading-relaxed text-stone">
        {SITE.name} brings together comfortable fabrics, careful finishing and designs that suit everyday life and special occasions.
        From light summer lawn to warm winter khaddar, every piece is chosen to look good and last.
      </p>
    </section>
  );
}
