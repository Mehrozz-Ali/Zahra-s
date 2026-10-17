"use client";

import { useRef } from "react";
import { SIZE_GUIDE } from "@/lib/sizeGuide";

export function SizeGuide() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="text-sm underline underline-offset-4 hover:text-rose-dark">Size guide</button>
      <dialog ref={dialog} aria-labelledby="size-guide-title" onClick={(e) => e.target === dialog.current && dialog.current.close()} className="m-auto w-[min(92vw,32rem)] border border-sand bg-ivory p-0 backdrop:bg-ink/50">
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="size-guide-title" className="font-display text-3xl">Size guide</h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close size guide" className="px-2 text-2xl leading-none">&times;</button>
          </div>
          <table className="w-full text-center text-sm">
            <caption className="mb-3 text-left text-stone">Approximate body measurements in inches.</caption>
            <thead><tr className="border-b border-sand"><th scope="col" className="py-2">Size</th><th scope="col">Bust</th><th scope="col">Waist</th><th scope="col">Hips</th></tr></thead>
            <tbody>
              {SIZE_GUIDE.map((r) => <tr key={r.size} className="border-b border-sand/60"><th scope="row" className="py-2 font-medium">{r.size}</th><td>{r.bust}</td><td>{r.waist}</td><td>{r.hips}</td></tr>)}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-stone">Between two sizes? Choose the larger one for a relaxed fit.</p>
        </div>
      </dialog>
    </>
  );
}
