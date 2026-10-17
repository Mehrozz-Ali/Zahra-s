"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { profileSchema, type ProfileInput } from "@/lib/validations/user";
import { useUpdateProfileMutation } from "@/services/userApi";

export function ProfileForm() {
  const { user } = useAuth();
  const [updateProfile] = useUpdateProfileMutation();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  const onSubmit = async (values: ProfileInput) => {
    setStatus(null);
    try {
      const updated = await updateProfile(values).unwrap();
      reset({ name: updated.name, phone: updated.phone ?? "" });
      setStatus({ ok: true, text: "Profile updated" });
    } catch (e) {
      setStatus({ ok: false, text: getErrorMessage(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      <h2 className="font-display text-2xl">Personal details</h2>
      <FormField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <FormField label="Email" value={user?.email ?? ""} readOnly hint="Email cannot be changed" />
      <FormField label="Mobile number" type="tel" inputMode="tel" placeholder="03001234567" error={errors.phone?.message} {...register("phone")} />
      {status && <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-sm text-green-800" : "text-sm text-red-700"}>{status.text}</p>}
      <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="sm:w-auto">Save changes</Button>
    </form>
  );
}
