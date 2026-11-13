"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField({ label, error, hint, type, className, ...rest }, ref) {
  const id = useId();
  const messageId = `${id}-message`;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`h-12 w-full border border-sand bg-white px-4 text-base outline-none transition-colors focus:border-rose-dark aria-[invalid=true]:border-red-700 ${isPassword ? "pr-12" : ""} ${className ?? ""}`}
          {...rest}
        />
        {isPassword && (
          // 44px touch target on phones; type="button" so it never submits the form
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-stone hover:text-ink focus-visible:text-ink"
          >
            {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={messageId} role={error ? "alert" : undefined} className={error ? "text-sm text-red-700" : "text-sm text-stone"}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
