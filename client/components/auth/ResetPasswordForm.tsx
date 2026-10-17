"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { resetPasswordSchema, type ResetPasswordFormInput } from "@/lib/validations/auth";
import { useResetPasswordMutation } from "@/services/authApi";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [resetPassword] = useResetPasswordMutation();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormInput>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token) {
    return (
      <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">
        This reset link is incomplete. <Link href="/auth/forgot-password" className="underline">Request a new one</Link>.
      </p>
    );
  }

  const onSubmit = async ({ password }: ResetPasswordFormInput) => {
    setServerError("");
    try {
      await resetPassword({ token, password }).unwrap();
      router.replace("/auth/login");
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number" error={errors.password?.message} {...register("password")} />
      <FormField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      {serverError && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
      <Button type="submit" loading={isSubmitting}>Update password</Button>
    </form>
  );
}
