import clsx from "clsx";

const steps = ["Address", "Delivery", "Payment", "Review"];

export function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label="Checkout progress" className="mb-10 flex items-center gap-2 text-sm">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        return (
          <li key={label} aria-current={n === current ? "step" : undefined} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs", n === current ? "border-ink bg-ink text-ivory" : done ? "border-rose-dark bg-rose-dark text-ivory" : "border-sand text-stone")}>
              {done ? <span aria-hidden>&#10003;</span> : n}
              {done && <span className="sr-only">Completed: </span>}
            </span>
            <span className={clsx("hidden sm:inline", n === current ? "font-medium" : "text-stone")}>{label}</span>
            {n < steps.length && <span aria-hidden className="h-px flex-1 bg-sand" />}
          </li>
        );
      })}
    </ol>
  );
}
