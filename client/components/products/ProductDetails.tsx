import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { Product } from "@/types";

const summary = "cursor-pointer list-none py-4 font-medium after:float-right after:content-['+'] open:after:content-['\\2212']";

export function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="divide-y divide-sand border-b border-sand">
      <details open>
        <summary className={summary}>Description</summary>
        <p className="whitespace-pre-line pb-5 leading-relaxed text-stone">{product.description}</p>
      </details>
      <details>
        <summary className={summary}>Product details</summary>
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 pb-5 text-sm">
          {product.material && <><dt className="text-stone">Material</dt><dd>{product.material}</dd></>}
          {product.brand && <><dt className="text-stone">Brand</dt><dd>{product.brand}</dd></>}
          <dt className="text-stone">Category</dt><dd>{product.category.name}</dd>
          <dt className="text-stone">SKU</dt><dd>{product.sku}</dd>
        </dl>
      </details>
      <details>
        <summary className={summary}>Shipping information</summary>
        <p className="pb-5 text-sm leading-relaxed text-stone">
          Delivery across Pakistan in {SITE.deliveryTime}. Delivery costs {formatPrice(SITE.shippingFee)}, and is free on orders over {formatPrice(SITE.freeShippingOver)}. Cash on delivery is available.
        </p>
      </details>
      <details>
        <summary className={summary}>Return information</summary>
        <p className="pb-5 text-sm leading-relaxed text-stone">
          Not the right fit? Request a return within {SITE.returnDays} days of delivery. Items must be unworn, unwashed and have their tags attached.
        </p>
      </details>
    </div>
  );
}
