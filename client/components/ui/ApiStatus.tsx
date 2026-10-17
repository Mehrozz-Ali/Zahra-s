"use client";

import { useGetHealthQuery } from "@/services/api";

export function ApiStatus() {
  const { data, isLoading, isError } = useGetHealthQuery();

  const text = isLoading
    ? "Checking server connection..."
    : isError
      ? "Cannot reach the API. Start the server and check NEXT_PUBLIC_API_URL."
      : `API connected. Database ${data?.database}.`;

  return (
    <p role="status" className={`text-sm ${isError ? "text-red-700" : "text-stone"}`}>
      {text}
    </p>
  );
}
