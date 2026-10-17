"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { useForgotPasswordMutation } from "@/services/authApi";

export function ForgotPasswordForm() {
  const [forgotPassword] = useForgotPasswordMutation();
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setServerError("");
    try {
      setMessage(await forgotPassword(values).unwrap());
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  if (message) return <p role="status" className="bg-sand/50 p-4 text-sm">{message}. The link works for 30 minutes.</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      {serverError && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
      <Button type="submit" loading={isSubmitting}>Send reset link</Button>
    </form>
  );
}
