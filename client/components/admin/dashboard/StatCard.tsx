import type { ReactNode } from "react";

export function StatCard({ label, value, note, icon }: { label: string; value: string; note?: string; icon: ReactNode }) {
  return (
    <div className="border border-sand bg-white p-5">
      <div className="flex items-center justify-between text-stone"><p className="text-sm">{label}</p><span aria-hidden>{icon}</span></div>
      <p className="mt-2 font-display text-4xl leading-none tabular-nums">{value}</p>
      {note && <p className="mt-2 text-xs text-stone">{note}</p>}
    </div>
  );
}
