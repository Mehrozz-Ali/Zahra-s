import clsx from "clsx";
import Image from "next/image";
import { SITE } from "@/lib/site";

interface BrandLogoProps {
  /** header: the sticky bar. footer and auth: a little larger and centred. */
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}

const SIZES = {
  sm: { mark: "h-9", name: "text-[1.05rem] tracking-[0.26em]", sub: "hidden" },
  md: { mark: "h-11", name: "text-[1.35rem] tracking-[0.28em]", sub: "text-[0.55rem] tracking-[0.4em]" },
  lg: { mark: "h-14", name: "text-[1.8rem] tracking-[0.3em]", sub: "text-[0.65rem] tracking-[0.42em]" },
} as const;

/**
 * The Zahra's logo: the Z with the plumeria flower (a transparent picture) next to the name set in the site's own serif font.
 * The name is real text, so it stays sharp at every size, matches the page colours and can be read by screen readers.
 */
export function BrandLogo({ size = "md", className, priority }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <span className={clsx("inline-flex items-center gap-3", className)}>
      <Image src="/brand/zahra-mark.png" alt="" width={339} height={360} priority={priority} className={clsx(s.mark, "w-auto")} />
      <span className="flex flex-col items-start leading-none">
        <span className={clsx("font-display font-medium uppercase text-ink", s.name)}>{SITE.name}</span>
        <span className={clsx("mt-1.5 font-display uppercase text-stone", s.sub)}>Clothing Brand</span>
      </span>
    </span>
  );
}
