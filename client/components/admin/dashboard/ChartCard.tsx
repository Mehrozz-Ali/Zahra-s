"use client";

import { useState, type ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle: string;
  /** The same data as the chart, for the table view (keyboard and screen reader friendly). */
  table: { head: string[]; rows: string[][] };
  children: ReactNode;
}

/** A single-series chart needs no legend box: the title and subtitle say what is plotted. */
export function ChartCard({ title, subtitle, table, children }: ChartCardProps) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="viz-root min-w-0 border border-sand bg-white p-5" aria-label={title}>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          <p className="text-sm text-stone">{subtitle}</p>
        </div>
        <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="shrink-0 text-sm underline underline-offset-4 hover:text-rose-dark">
          {asTable ? "View chart" : "View as table"}
        </button>
      </header>
      {asTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-white"><tr>{table.head.map((h, i) => <th key={h} scope="col" className={`border-b border-sand py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>{table.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={`border-b border-sand/60 py-1.5 ${i > 0 ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : children}
    </section>
  );
}
