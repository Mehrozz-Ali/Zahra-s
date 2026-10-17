"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { PROVINCES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { addressSchema, type AddressFormInput } from "@/lib/validations/user";
import { useAddAddressMutation, useUpdateAddressMutation } from "@/services/userApi";
import type { Address } from "@/types";

interface AddressFormProps {
  initial?: Address;
  onDone: () => void;
}

export function AddressForm({ initial, onDone }: AddressFormProps) {
  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressFormInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: initial?.fullName ?? "",
      phone: initial?.phone ?? "",
      line1: initial?.line1 ?? "",
      line2: initial?.line2 ?? "",
      city: initial?.city ?? "",
      province: (initial?.province as AddressFormInput["province"] | undefined) ?? undefined,
      postalCode: initial?.postalCode ?? "",
      isDefault: initial?.isDefault ?? false,
    },
  });

  const onSubmit = async (values: AddressFormInput) => {
    setServerError("");
    try {
      if (initial?._id) await updateAddress({ id: initial._id, changes: values }).unwrap();
      else await addAddress(values).unwrap();
      onDone();
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 border border-sand bg-white p-6 sm:grid-cols-2">
      <h2 className="font-display text-2xl sm:col-span-2">{initial ? "Edit address" : "New address"}</h2>
      <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
      <FormField label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="03001234567" error={errors.phone?.message} {...register("phone")} />
      <div className="sm:col-span-2"><FormField label="House, street, area" autoComplete="address-line1" error={errors.line1?.message} {...register("line1")} /></div>
      <div className="sm:col-span-2"><FormField label="Apartment, landmark (optional)" autoComplete="address-line2" error={errors.line2?.message} {...register("line2")} /></div>
      <FormField label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
      <SelectField label="Province" options={PROVINCES} placeholder="Choose province" error={errors.province?.message} {...register("province")} />
      <FormField label="Postal code (optional)" inputMode="numeric" autoComplete="postal-code" error={errors.postalCode?.message} {...register("postalCode")} />
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-rose-dark" {...register("isDefault")} /> Use as my default address
      </label>
      {serverError && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{serverError}</p>}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={isSubmitting} className="sm:w-auto">Save address</Button>
        <Button type="button" variant="outline" onClick={onDone} className="sm:w-auto">Cancel</Button>
      </div>
    </form>
  );
}
