"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";
import { useChangePasswordMutation } from "@/services/authApi";

export function ChangePasswordForm() {
  const [changePassword] = useChangePasswordMutation();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordInput) => {
    setStatus(null);
    try {
      await changePassword(values).unwrap();
      reset();
      setStatus({ ok: true, text: "Password changed" });
    } catch (e) {
      setStatus({ ok: false, text: getErrorMessage(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      <h2 className="font-display text-2xl">Change password</h2>
      <FormField label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
      <FormField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number" error={errors.newPassword?.message} {...register("newPassword")} />
      {status && <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-sm text-green-800" : "text-sm text-red-700"}>{status.text}</p>}
      <Button type="submit" loading={isSubmitting} className="sm:w-auto">Update password</Button>
    </form>
  );
}
