"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { safeRedirect } from "@/lib/safeRedirect";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useLoginMutation } from "@/services/authApi";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [login] = useLoginMutation();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError("");
    try {
      const user = await login(values).unwrap();
      router.replace(safeRedirect(params.get("redirect"), user.role === "admin" ? "/admin" : "/"));
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <FormField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      <div className="text-right text-sm">
        <Link href="/auth/forgot-password" className="underline underline-offset-4">Forgot password?</Link>
      </div>
      {serverError && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
      <Button type="submit" loading={isSubmitting}>Log in</Button>
    </form>
  );
}
