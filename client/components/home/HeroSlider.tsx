"use client";

import clsx from "clsx";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import type { Banner } from "@/types";

const INTERVAL_MS = 6000;

/** Homepage banners the admin manages: text on the left, picture on the right. One banner stays still; several fade from one to the next. */
export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = banners.length;
  const many = count > 1;

  const go = useCallback((to: number) => setIndex(((to % count) + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!many || paused || reduceMotion) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [many, paused, reduceMotion, count]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured banners"
      className="mx-auto max-w-7xl px-4 pb-4 pt-5 sm:px-6 md:pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const end = e.changedTouches[0]?.clientX;
        touchStart.current = null;
        if (!many || start == null || end == null || Math.abs(end - start) < 50) return;
        go(index + (end < start ? 1 : -1));
      }}
    >
      <h1 className="sr-only">{SITE.name} - {SITE.tagline}</h1>

      <div className="relative overflow-hidden bg-sand/70">
        <div className="grid">
          {banners.map((b, i) => {
            const active = i === index;
            const link = b.buttonLink;
            const external = !!link && !link.startsWith("/");
            const buttonClass = "group mt-8 inline-flex items-center gap-3 bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory transition-colors hover:bg-rose-dark";
            const buttonInner = <>{b.buttonText}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></>;
            const picture = b.image && (
              <span className="relative block h-80 aspect-[4/5] overflow-hidden shadow-xl ring-1 ring-ink/5 md:h-[28.75rem]">
                <Image src={b.image.url} alt={b.title ?? ""} fill priority={i === 0} sizes="368px" className="object-cover object-top" />
              </span>
            );
            return (
              <div
                key={b._id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!active}
                inert={!active}
                className={clsx("col-start-1 row-start-1 grid transition-opacity duration-700 motion-reduce:transition-none md:min-h-[30rem] md:grid-cols-2", active ? "opacity-100" : "pointer-events-none opacity-0")}
              >
                <div className="flex flex-col justify-center px-6 py-10 sm:px-12 md:px-14 lg:px-20">
                  {b.eyebrow && (
                    <p className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-rose-dark">
                      <span aria-hidden className="h-px w-8 bg-rose-dark" />{b.eyebrow}
                    </p>
                  )}
                  {b.title && <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{b.title}</h2>}
                  {b.subtitle && <p className="mt-4 max-w-md text-base text-stone sm:text-lg">{b.subtitle}</p>}
                  {b.buttonText && link && (
                    <span>
                      {external
                        ? <a href={link} target="_blank" rel="noopener noreferrer" className={buttonClass}>{buttonInner}</a>
                        : <Link href={link} className={buttonClass}>{buttonInner}</Link>}
                    </span>
                  )}
                </div>

                {/* The picture always has the same size; a soft blurred copy of it fills the rest of the panel */}
                <div className="relative flex items-center justify-center overflow-hidden px-6 pb-12 pt-2 md:px-0 md:py-0">
                  {b.image && (
                    <Image src={b.image.url} alt="" aria-hidden fill sizes="64px" quality={20} className="scale-125 object-cover opacity-50 blur-2xl" />
                  )}
                  {picture && link && !b.buttonText
                    ? external
                      ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={b.title || "Open banner"} className="relative">{picture}</a>
                      : <Link href={link} aria-label={b.title || "Open banner"} className="relative">{picture}</Link>
                    : <span className="relative">{picture}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {many && (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous banner" className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-sand bg-ivory text-ink hover:bg-white md:inline-flex"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next banner" className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-sand bg-ivory text-ink hover:bg-white md:inline-flex"><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
      </div>

      {many && (
        <div className="mt-3 flex justify-center gap-1">
          {banners.map((b, i) => (
            <button key={b._id} type="button" onClick={() => go(i)} aria-label={`Show banner ${i + 1}`} aria-current={i === index} className="group flex h-6 w-6 items-center justify-center">
              <span className={clsx("block h-2 rounded-full transition-all", i === index ? "w-6 bg-ink" : "w-2 bg-ink/30 group-hover:bg-ink/60")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
