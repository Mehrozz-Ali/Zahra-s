"use client";

import clsx from "clsx";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import type { Banner } from "@/types";

const INTERVAL_MS = 6000;
const BANNER_BG = "#f3eee7"; // soft sand; the badge ring uses the same colour so it blends in

/**
 * Homepage banners the admin manages. Text on the left and the picture in an arch frame on the right;
 * on phones the picture comes first, then the text. One banner stays still; several fade from one to the next.
 */
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

  const arrow = "pointer-events-auto absolute top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-sand bg-ivory text-ink transition-colors hover:bg-white";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured banners"
      style={{ backgroundColor: BANNER_BG }}
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

      <div className="relative mx-auto max-w-7xl">
        <div className="grid">
          {banners.map((b, i) => {
            const active = i === index;
            const link = b.buttonLink;
            const external = !!link && !link.startsWith("/");
            const buttonClass = "group mt-8 inline-flex h-[52px] items-center gap-3 bg-ink px-8 text-sm uppercase tracking-widest text-ivory transition-colors hover:bg-rose-dark";
            const buttonInner = <>{b.buttonText}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></>;
            const picture = b.image && (
              <span className="relative block h-[25rem] w-[17rem] md:h-[22rem] md:w-[15rem] lg:h-[28rem] lg:w-[22rem]">
                {/* The paler arch behind the photo */}
                <span aria-hidden className="absolute inset-0 -translate-x-5 translate-y-3 rounded-t-full bg-sand lg:-translate-x-8 lg:translate-y-4" />
                <span className="absolute inset-0 overflow-hidden rounded-t-full bg-sand">
                  <Image src={b.image.url} alt={b.title ?? ""} fill priority={i === 0} sizes="(min-width: 1024px) 352px, 272px" className="object-cover object-top" />
                </span>
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
                className={clsx("col-start-1 row-start-1 grid transition-opacity duration-700 motion-reduce:transition-none md:min-h-[32rem] md:grid-cols-2", active ? "opacity-100" : "pointer-events-none opacity-0")}
              >
                <div className="flex flex-col justify-center px-6 pb-14 pt-6 sm:px-12 md:px-14 md:py-12 lg:px-20">
                  {b.eyebrow && (
                    <p className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-rose-dark">
                      <span aria-hidden className="h-px w-8 bg-rose-dark" />{b.eyebrow}
                    </p>
                  )}
                  {b.title && <h2 className="max-w-xl font-display text-[2.75rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">{b.title}</h2>}
                  {b.subtitle && <p className="mt-4 max-w-md text-base text-stone sm:text-lg">{b.subtitle}</p>}
                  {b.buttonText && link && (
                    <span>
                      {external
                        ? <a href={link} target="_blank" rel="noopener noreferrer" className={buttonClass}>{buttonInner}</a>
                        : <Link href={link} className={buttonClass}>{buttonInner}</Link>}
                    </span>
                  )}
                </div>

                {/* order-first: on phones the picture sits above the text */}
                <div className="relative order-first flex items-center justify-center px-6 pb-2 pt-10 md:order-none md:px-0 md:py-8">
                  {picture && (
                    <div className="relative">
                      {link && !b.buttonText
                        ? external
                          ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={b.title || "Open banner"} className="block">{picture}</a>
                          : <Link href={link} aria-label={b.title || "Open banner"} className="block">{picture}</Link>
                        : picture}
                      <span aria-hidden className="absolute -left-6 bottom-20 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-rose-dark text-ivory md:-left-8 md:h-24 md:w-24 lg:-left-14 lg:h-28 lg:w-28" style={{ boxShadow: `0 0 0 5px ${BANNER_BG}` }}>
                        <span className="font-display text-2xl italic leading-none lg:text-3xl">New</span>
                        <span className="mt-1 text-[10px] uppercase tracking-[0.2em] lg:text-[11px]">In store</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {many && (
          <>
            {/* Arrows live in the picture half, level with the middle of the picture, so they never sit over the text */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
              <button type="button" onClick={() => go(index - 1)} aria-label="Previous banner" className={clsx(arrow, "left-3")}><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Next banner" className={clsx(arrow, "right-3")}><ChevronRight className="h-5 w-5" /></button>
            </div>

            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1 md:bottom-7 md:justify-start md:px-14 lg:px-20">
              {banners.map((b, i) => (
                <button key={b._id} type="button" onClick={() => go(i)} aria-label={`Show banner ${i + 1}`} aria-current={i === index} className="group flex h-6 w-6 items-center justify-center">
                  <span className={clsx("block h-2 rounded-full transition-all", i === index ? "w-6 bg-ink" : "w-2 bg-ink/30 group-hover:bg-ink/60")} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
