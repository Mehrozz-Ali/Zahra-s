import { Button } from "@/components/ui/Button";
import { CARD_PAYMENTS_ENABLED } from "@/lib/constants";

type Method = "cod" | "stripe";

interface PaymentStepProps {
  value: Method;
  onChange: (method: Method) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentStep({ value, onChange, onBack, onNext }: PaymentStepProps) {
  const option = "flex items-center gap-3 border bg-white p-4";
  return (
    <section aria-labelledby="payment-heading" className="space-y-6">
      <h2 id="payment-heading" className="font-display text-3xl">Payment method</h2>
      <fieldset className="space-y-3">
        <legend className="sr-only">Choose a payment method</legend>
        <label className={`${option} cursor-pointer ${value === "cod" ? "border-ink" : "border-sand"}`}>
          <input type="radio" name="payment" value="cod" checked={value === "cod"} onChange={() => onChange("cod")} className="accent-rose-dark" />
          <span><span className="block font-medium">Cash on delivery</span><span className="text-sm text-stone">Pay the courier when your order arrives.</span></span>
        </label>
        <label className={`${option} ${CARD_PAYMENTS_ENABLED ? "cursor-pointer" : "opacity-60"} ${value === "stripe" ? "border-ink" : "border-sand"}`}>
          <input type="radio" name="payment" value="stripe" checked={value === "stripe"} disabled={!CARD_PAYMENTS_ENABLED} onChange={() => onChange("stripe")} className="accent-rose-dark" />
          <span><span className="block font-medium">Debit or credit card</span><span className="text-sm text-stone">{CARD_PAYMENTS_ENABLED ? "Pay securely online. Your card details never touch our servers." : "Available soon."}</span></span>
        </label>
      </fieldset>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="sm:w-auto">Back</Button>
        <Button type="button" onClick={onNext} className="sm:w-auto">Review order</Button>
      </div>
    </section>
  );
}
