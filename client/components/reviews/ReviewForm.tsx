"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/errors";
import { reviewFormSchema, type ReviewFormInput } from "@/lib/validations/review";
import { useCreateReviewMutation, useUpdateReviewMutation } from "@/services/reviewApi";
import { StarInput } from "./StarInput";

interface ReviewFormProps {
  productId: string;
  existing?: { _id: string; rating: number; comment: string };
  onDone?: () => void;
}

/** Creates a review, or edits the customer's own when `existing` is given. */
export function ReviewForm({ productId, existing, onDone }: ReviewFormProps) {
  const [createReview] = useCreateReviewMutation();
  const [updateReview] = useUpdateReviewMutation();
  const [serverError, setServerError] = useState("");
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReviewFormInput>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");
    try {
      if (existing) await updateReview({ id: existing._id, productId, ...values }).unwrap();
      else await createReview({ productId, ...values }).unwrap();
      onDone?.();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-sand bg-white p-5">
      <h3 className="font-display text-2xl">{existing ? "Edit your review" : "Write a review"}</h3>
      <Controller control={control} name="rating" render={({ field }) => <StarInput value={field.value} onChange={field.onChange} error={errors.rating?.message} />} />
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="block text-sm font-medium">Your review</label>
        <textarea id="review-comment" rows={4} maxLength={1000} aria-invalid={errors.comment ? true : undefined} placeholder="How was the fit, fabric and quality?"
          className="w-full border border-sand bg-white p-4 text-base outline-none focus:border-rose-dark aria-[invalid=true]:border-red-700" {...register("comment")} />
        {errors.comment && <p role="alert" className="text-sm text-red-700">{errors.comment.message}</p>}
      </div>
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting} className="sm:w-auto">{existing ? "Save changes" : "Submit review"}</Button>
        {existing && <Button type="button" variant="outline" onClick={onDone} className="sm:w-auto">Cancel</Button>}
      </div>
    </form>
  );
}
