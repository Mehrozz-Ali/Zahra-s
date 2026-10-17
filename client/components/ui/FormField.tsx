import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField({ label, error, hint, ...rest }, ref) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className="h-12 w-full border border-sand bg-white px-4 text-base outline-none transition-colors focus:border-rose-dark aria-[invalid=true]:border-red-700"
        {...rest}
      />
      {(error || hint) && (
        <p id={messageId} role={error ? "alert" : undefined} className={error ? "text-sm text-red-700" : "text-sm text-stone"}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
