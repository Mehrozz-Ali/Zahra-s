import clsx from "clsx";
import { Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, EyeOff, ExternalLink, Pencil, RotateCcw, Star, Trash2, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

export const ACTION_ICONS = {
  view: Eye, hide: EyeOff, edit: Pencil, delete: Trash2, archive: Archive, restore: RotateCcw,
  up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight, open: ExternalLink, primary: Star, remove: X,
} satisfies Record<string, LucideIcon>;
export type ActionIconName = keyof typeof ACTION_ICONS;

interface Common {
  icon: ActionIconName;
  /** Read by screen readers and shown as a tooltip */
  label: string;
  tone?: "default" | "danger";
  className?: string;
}

const base = "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const tones = {
  default: "text-ink hover:border-sand hover:bg-sand/60 hover:text-rose-dark",
  danger: "text-red-700 hover:border-red-200 hover:bg-red-50",
};

/** A small icon-only button (or link when `href` is given) with an accessible name and a tooltip. */
export function IconAction(props: Common & ({ href: string; target?: string } | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }))) {
  const { icon, label, tone = "default", className } = props;
  const Icon = ACTION_ICONS[icon];
  const classes = clsx(base, tones[tone], className);
  if (props.href !== undefined) {
    return (
      <Link href={props.href} target={props.target} aria-label={label} title={label} className={classes}>
        <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
      </Link>
    );
  }
  const { icon: _i, label: _l, tone: _t, className: _c, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} aria-label={label} title={label} className={classes} {...rest}>
      <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
    </button>
  );
}
