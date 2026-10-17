"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getErrorMessage } from "@/lib/errors";
import { useSubscribeMutation } from "@/services/newsletterApi";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export function NewsletterSection() {
  const [subscribe] = useSubscribeMutation();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    try {
      setStatus({ ok: true, text: await subscribe(values).unwrap() });
      reset();
    } catch (e) {
      setStatus({ ok: false, text: getErrorMessage(e) });
    }
  };

  return (
    <section aria-labelledby="newsletter-heading" className="bg-sand/50">
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h2 id="newsletter-heading" className="font-display text-4xl">Stay in the loop</h2>
        <p className="mb-6 mt-2 text-stone">New arrivals and offers, straight to your inbox.</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input id="newsletter-email" type="email" autoComplete="email" placeholder="Your email address" aria-invalid={errors.email ? true : undefined} aria-describedby="newsletter-message" className="h-12 flex-1 border border-sand bg-white px-4 outline-none focus:border-rose-dark" {...register("email")} />
          <button type="submit" disabled={isSubmitting} className="h-12 bg-ink px-8 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark disabled:opacity-60">{isSubmitting ? "Please wait..." : "Subscribe"}</button>
        </form>
        <p id="newsletter-message" role={errors.email || status?.ok === false ? "alert" : "status"} className={`mt-3 min-h-5 text-sm ${errors.email || status?.ok === false ? "text-red-700" : "text-green-800"}`}>
          {errors.email?.message ?? status?.text}
        </p>
      </div>
    </section>
  );
}
