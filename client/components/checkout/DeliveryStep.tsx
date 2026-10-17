import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { DeliveryMethod, DeliveryQuote } from "@/types";

interface DeliveryStepProps {
  options: DeliveryQuote[] | undefined;
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
  onBack: () => void;
  onNext: () => void;
}

export function DeliveryStep({ options, value, onChange, onBack, onNext }: DeliveryStepProps) {
  return (
    <section aria-labelledby="delivery-heading" className="space-y-6">
      <h2 id="delivery-heading" className="font-display text-3xl">Delivery method</h2>
      {!options ? (
        <p className="text-stone">Loading delivery options...</p>
      ) : (
        <fieldset className="space-y-3">
          <legend className="sr-only">Choose a delivery method</legend>
          {options.map((o) => (
            <label key={o.method} className="flex cursor-pointer items-center justify-between gap-4 border border-sand bg-white p-4 has-[:checked]:border-ink">
              <span className="flex items-center gap-3">
                <input type="radio" name="delivery" value={o.method} checked={value === o.method} onChange={() => onChange(o.method)} className="accent-rose-dark" />
                <span><span className="block font-medium">{o.label}</span><span className="text-sm text-stone">{o.estimate}</span></span>
              </span>
              <span className="font-medium">{o.summary.shippingCost === 0 ? "Free" : formatPrice(o.summary.shippingCost)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="sm:w-auto">Back</Button>
        <Button type="button" onClick={onNext} disabled={!options} className="sm:w-auto">Continue to payment</Button>
      </div>
    </section>
  );
}
