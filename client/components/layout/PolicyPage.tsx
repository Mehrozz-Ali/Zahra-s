import type { ReactNode } from "react";

export interface PolicySection { heading: string; body: ReactNode }

/**
 * A plain, easy-to-read page: a centred title, a short opening line, then each topic as a bold heading
 * followed by ordinary paragraphs. No contents box and no numbering.
 */
export function PolicyPage({ title, intro, sections }: { title: string; intro: ReactNode; updated?: string; sections: PolicySection[] }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <h1 className="text-center font-display text-4xl font-semibold sm:text-5xl">{title}</h1>

      <div className="mt-8 space-y-5 text-base leading-8 text-ink sm:mt-10 sm:text-[1.05rem]">
        {typeof intro === "string" ? <p>{intro}</p> : intro}
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 mt-8 font-sans text-lg font-semibold">{s.heading}</h2>
            <div className="space-y-4 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-rose-dark [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_ol]:space-y-2 [&_strong]:font-semibold [&_ul]:space-y-2">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
