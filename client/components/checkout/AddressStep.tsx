"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { useAuth } from "@/hooks/useAuth";
import { PROVINCES } from "@/lib/constants";
import { checkoutAddressSchema, guestCheckoutAddressSchema, type CheckoutAddressInput } from "@/lib/validations/checkout";
import { useAddAddressMutation } from "@/services/userApi";
import type { Address, ShippingAddress } from "@/types";

const toShipping = (a: Address): ShippingAddress => ({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, province: a.province, postalCode: a.postalCode });

interface AddressStepProps {
  initial: ShippingAddress | null;
  initialEmail?: string;
  onNext: (address: ShippingAddress, email?: string) => void;
}

export function AddressStep({ initial, initialEmail, onNext }: AddressStepProps) {
  const { user, isLoading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;
  const saved = user?.addresses ?? [];
  const [choice, setChoice] = useState<string>(() => (saved.length === 0 ? "new" : (saved.find((a) => a.isDefault) ?? saved[0])?._id ?? "new"));
  const [addAddress] = useAddAddressMutation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutAddressInput>({
    resolver: zodResolver(isGuest ? guestCheckoutAddressSchema : checkoutAddressSchema),
    defaultValues: { fullName: initial?.fullName ?? user?.name ?? "", phone: initial?.phone ?? user?.phone ?? "", line1: initial?.line1 ?? "", line2: initial?.line2 ?? "", city: initial?.city ?? "", province: initial?.province as CheckoutAddressInput["province"] | undefined, postalCode: initial?.postalCode ?? "", saveAddress: false, email: initialEmail ?? "" },
  });

  const submitNew = async ({ saveAddress, email, ...address }: CheckoutAddressInput) => {
    if (saveAddress && !isGuest) await addAddress({ ...address, isDefault: saved.length === 0 }).unwrap().catch(() => undefined); // saving is a bonus; never block checkout on it
    onNext(address, isGuest ? email : undefined);
  };

  return (
    <section aria-labelledby="address-heading" className="space-y-6">
      <h2 id="address-heading" className="font-display text-3xl">Shipping address</h2>

      {saved.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="sr-only">Choose an address</legend>
          {saved.map((a) => (
            <label key={a._id} className="flex cursor-pointer gap-3 border border-sand bg-white p-4 has-[:checked]:border-ink">
              <input type="radio" name="address" value={a._id} checked={choice === a._id} onChange={() => setChoice(a._id ?? "new")} className="mt-1 accent-rose-dark" />
              <span className="text-sm leading-relaxed"><strong>{a.fullName}</strong>{a.isDefault && <span className="ml-2 bg-sand px-1.5 py-0.5 text-[11px] uppercase tracking-wider">Default</span>}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.province}<br />{a.phone}</span>
            </label>
          ))}
          <label className="flex cursor-pointer gap-3 border border-sand bg-white p-4 has-[:checked]:border-ink">
            <input type="radio" name="address" value="new" checked={choice === "new"} onChange={() => setChoice("new")} className="accent-rose-dark" />
            <span className="text-sm">Use a new address</span>
          </label>
        </fieldset>
      )}

      {choice !== "new" ? (
        <Button type="button" className="sm:w-auto" onClick={() => { const a = saved.find((x) => x._id === choice); if (a) onNext(toShipping(a)); }}>Continue to delivery</Button>
      ) : (
        <form onSubmit={handleSubmit(submitNew)} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {isGuest && <div className="sm:col-span-2"><FormField label="Email (for your order confirmation)" type="email" inputMode="email" autoComplete="email" error={errors.email?.message} {...register("email")} /></div>}
          <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
          <FormField label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="03001234567" error={errors.phone?.message} {...register("phone")} />
          <div className="sm:col-span-2"><FormField label="House, street, area" autoComplete="address-line1" error={errors.line1?.message} {...register("line1")} /></div>
          <div className="sm:col-span-2"><FormField label="Apartment, landmark (optional)" autoComplete="address-line2" error={errors.line2?.message} {...register("line2")} /></div>
          <FormField label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
          <SelectField label="Province" options={PROVINCES} placeholder="Choose province" error={errors.province?.message} {...register("province")} />
          <FormField label="Postal code (optional)" inputMode="numeric" autoComplete="postal-code" error={errors.postalCode?.message} {...register("postalCode")} />
          {isGuest ? <p className="self-end pb-3 text-sm text-stone">Checking out as a guest. <Link href="/auth/login?redirect=/checkout" className="underline underline-offset-4">Log in</Link> or <Link href="/auth/register?redirect=/checkout" className="underline underline-offset-4">create an account</Link> to save addresses and track orders.</p>
            : <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose-dark" {...register("saveAddress")} /> Save this address to my account</label>}
          <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting} className="sm:w-auto">Continue to delivery</Button></div>
        </form>
      )}
    </section>
  );
}
