"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { safeRedirect } from "@/lib/safeRedirect";
import { registerSchema, type RegisterFormInput } from "@/lib/validations/auth";
import { useRegisterMutation } from "@/services/authApi";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [registerUser] = useRegisterMutation();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ name, email, phone, password }: RegisterFormInput) => {
    setServerError("");
    try {
      await registerUser({ name, email, password, phone: phone || undefined }).unwrap();
      router.replace(safeRedirect(params.get("redirect"), "/"));
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <FormField label="Mobile number (optional)" type="tel" inputMode="tel" autoComplete="tel" placeholder="03001234567" error={errors.phone?.message} {...register("phone")} />
      <FormField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number" error={errors.password?.message} {...register("password")} />
      <FormField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      {serverError && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
      <Button type="submit" loading={isSubmitting}>Create account</Button>
    </form>
  );
}
