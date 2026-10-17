"use client";

import { useGetMeQuery } from "@/services/authApi";

export function useAuth() {
  const { data, isLoading } = useGetMeQuery();
  return { user: data ?? null, isLoading, isAuthenticated: Boolean(data), isAdmin: data?.role === "admin" };
}
