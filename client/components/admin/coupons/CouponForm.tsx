"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { couponFormSchema, toCouponPayload, type CouponFormInput, type CouponFormOutput } from "@/lib/validations/coupon";
import { useCreateCouponMutation, useUpdateCouponMutation } from "@/services/couponApi";
import type { Coupon } from "@/types";

/** Value for <input type="datetime-local">, in the browser's local time. */
const toLocalInput = (iso: string | Date) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function CouponForm({ coupon, onDone }: { coupon?: Coupon; onDone: () => void }) {
  const [create] = useCreateCouponMutation();
  const [update] = useUpdateCouponMutation();
  const [serverError, setServerError] = useState("");
  const inThirtyDays = new Date(Date.now() + 30 * 86400000);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CouponFormInput, unknown, CouponFormOutput>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: coupon
      ? {
          code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minimumOrderAmount: coupon.minimumOrderAmount,
          maximumDiscount: coupon.maximumDiscount ? String(coupon.maximumDiscount) : "", startDate: toLocalInput(coupon.startDate), expiryDate: toLocalInput(coupon.expiryDate),
          usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "", isActive: coupon.isActive,
        }
      : { code: "", discountType: "percentage", discountValue: 10, minimumOrderAmount: 0, maximumDiscount: "", startDate: toLocalInput(new Date()), expiryDate: toLocalInput(inThirtyDays), usageLimit: "", isActive: true },
  });
  const isPercent = watch("discountType") === "percentage";

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");
    try {
      const body = toCouponPayload(values);
      if (coupon) await update({ id: coupon._id, body }).unwrap();
      else await create(body).unwrap();
      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-sand bg-white p-5">
      <h2 className="font-display text-3xl">{coupon ? `Edit ${coupon.code}` : "New coupon"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Code" error={errors.code?.message} className="h-12 w-full border border-sand bg-white px-4 text-base uppercase outline-none focus:border-rose-dark" autoCapitalize="characters" {...register("code")} />
        <div className="space-y-1.5">
          <label htmlFor="discountType" className="block text-sm font-medium">Discount type</label>
          <select id="discountType" className="h-12 w-full border border-sand bg-white px-3 text-base outline-none focus:border-rose-dark" {...register("discountType")}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount (Rs.)</option>
          </select>
        </div>
        <FormField label={isPercent ? "Discount (%)" : "Discount (Rs.)"} type="number" inputMode="decimal" step="any" error={errors.discountValue?.message} {...register("discountValue")} />
        <FormField label="Minimum order (Rs.)" type="number" inputMode="numeric" min={0} error={errors.minimumOrderAmount?.message} hint="0 means no minimum" {...register("minimumOrderAmount")} />
        <FormField label="Maximum discount (Rs.)" type="number" inputMode="numeric" min={1} error={errors.maximumDiscount?.message} hint="Optional cap, useful for percentages" {...register("maximumDiscount")} />
        <FormField label="Usage limit" type="number" inputMode="numeric" min={1} error={errors.usageLimit?.message} hint="Optional. Empty means unlimited" {...register("usageLimit")} />
        <FormField label="Starts" type="datetime-local" error={errors.startDate?.message} {...register("startDate")} />
        <FormField label="Expires" type="datetime-local" error={errors.expiryDate?.message} {...register("expiryDate")} />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-rose-dark)]" {...register("isActive")} /> Active (customers can use it)</label>
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting} className="sm:w-auto">{coupon ? "Save changes" : "Create coupon"}</Button>
        <Button type="button" variant="outline" onClick={onDone} className="sm:w-auto">Cancel</Button>
      </div>
    </form>
  );
}
