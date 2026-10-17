import type { ReactNode } from "react";

export interface PolicySection { heading: string; body: ReactNode }

/** A readable long-form page: a heading, a last-updated line, and numbered sections linked from a short contents list. */
export function PolicyPage({ title, intro, updated, sections }: { title: string; intro: string; updated: string; sections: PolicySection[] }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-dark">Customer care</p>
      <h1 className="font-display text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-stone">Last updated {updated}</p>
      <p className="mt-6 text-lg leading-relaxed text-stone">{intro}</p>

      <nav aria-label="On this page" className="mt-8 border border-sand bg-white p-5">
        <h2 className="mb-2 text-xs uppercase tracking-widest text-stone">On this page</h2>
        <ol className="list-inside list-decimal space-y-1 text-sm">
          {sections.map((s, i) => <li key={s.heading}><a href={`#s${i + 1}`} className="underline underline-offset-4 hover:text-rose-dark">{s.heading}</a></li>)}
        </ol>
      </nav>

      <div className="mt-10 space-y-9">
        {sections.map((s, i) => (
          <section key={s.heading} id={`s${i + 1}`} aria-labelledby={`h${i + 1}`} className="scroll-mt-24">
            <h2 id={`h${i + 1}`} className="mb-3 font-display text-3xl">{i + 1}. {s.heading}</h2>
            <div className="space-y-3 leading-relaxed text-stone [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-rose-dark [&_li]:ml-5 [&_li]:list-disc">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
