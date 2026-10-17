"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const startIndex = Math.max(0, images.findIndex((i) => i.isPrimary));
  const [active, setActive] = useState(startIndex);
  const current = images[active];

  if (!current) return <div className="aspect-[3/4] bg-sand" role="img" aria-label={`${name}, no photo available`} />;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto sm:max-h-[640px] sm:flex-col sm:overflow-y-auto" aria-label="Product photos">
          {images.map((img, i) => (
            <li key={img.publicId} className="shrink-0">
              <button type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1} of ${images.length}`} aria-current={i === active} className={clsx("relative block h-24 w-[72px] overflow-hidden border bg-sand", i === active ? "border-ink" : "border-transparent hover:border-stone")}>
                <Image src={img.url} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-sand">
        <Image src={current.url} alt={`${name}, photo ${active + 1}`} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
      </div>
    </div>
  );
}
