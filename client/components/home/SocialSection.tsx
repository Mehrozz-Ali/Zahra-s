import { SITE } from "@/lib/site";

export function SocialSection() {
  return (
    <section aria-labelledby="social-heading" className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 id="social-heading" className="font-display text-4xl">Follow along</h2>
      <p className="mb-6 mt-2 text-stone">Styling ideas, behind the scenes and new drops.</p>
      <div className="flex justify-center gap-4 text-sm uppercase tracking-widest">
        <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="border border-ink px-6 py-3 hover:bg-ink hover:text-ivory">Instagram</a>
        <a href={SITE.facebookUrl} target="_blank" rel="noopener noreferrer" className="border border-ink px-6 py-3 hover:bg-ink hover:text-ivory">Facebook</a>
      </div>
    </section>
  );
}
