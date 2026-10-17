import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "outline";
}

export function Button({ loading, variant = "primary", className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(
        "inline-flex h-12 w-full items-center justify-center px-6 text-sm font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" ? "bg-ink text-ivory hover:bg-rose-dark" : "border border-ink text-ink hover:bg-ink hover:text-ivory",
        className,
      )}
      {...rest}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
