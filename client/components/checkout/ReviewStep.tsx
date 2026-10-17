import { Button } from "@/components/ui/Button";
import type { DeliveryQuote, ShippingAddress } from "@/types";

interface ReviewStepProps {
  address: ShippingAddress;
  paymentMethod: "cod" | "stripe";
  delivery: DeliveryQuote | undefined;
  total: number | undefined;
  placing: boolean;
  error: string;
  onEdit: (step: 1 | 2 | 3) => void;
  onBack: () => void;
  onPlace: () => void;
}

export function ReviewStep({ address, paymentMethod, delivery, total, placing, error, onEdit, onBack, onPlace }: ReviewStepProps) {
  const block = "flex items-start justify-between gap-4 border border-sand bg-white p-4 text-sm";
  return (
    <section aria-labelledby="review-heading" className="space-y-6">
      <h2 id="review-heading" className="font-display text-3xl">Review your order</h2>
      <div className="space-y-3">
        <div className={block}>
          <div><h3 className="font-medium">Ship to</h3><p className="leading-relaxed text-stone">{address.fullName}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}, {address.province}<br />{address.phone}</p></div>
          <button type="button" onClick={() => onEdit(1)} className="underline underline-offset-4">Change</button>
        </div>
        <div className={block}>
          <div><h3 className="font-medium">Delivery</h3><p className="text-stone">{delivery ? `${delivery.label} (${delivery.estimate})` : "-"}</p></div>
          <button type="button" onClick={() => onEdit(2)} className="underline underline-offset-4">Change</button>
        </div>
        <div className={block}>
          <div><h3 className="font-medium">Payment</h3><p className="text-stone">{paymentMethod === "cod" ? "Cash on delivery. Please have the exact amount ready." : "Card payment. You will enter your card details on the next screen."}</p></div>
          <button type="button" onClick={() => onEdit(3)} className="underline underline-offset-4">Change</button>
        </div>
      </div>
      {error && <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={placing} className="sm:w-auto">Back</Button>
        <Button type="button" onClick={onPlace} loading={placing} disabled={total === undefined} className="sm:w-auto">{paymentMethod === "stripe" ? "Place order and pay" : "Place order"}</Button>
      </div>
      <p className="text-xs text-stone">By placing your order you agree to our terms and conditions and return policy.</p>
    </section>
  );
}
