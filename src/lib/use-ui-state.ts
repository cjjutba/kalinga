"use client";

import { useSearchParams } from "next/navigation";

// In development, ?state= forces a page's empty, loading or error state so it
// can be reviewed without arranging data. In production it does nothing, so a
// visitor cannot make a real page pretend. Components that call this must sit
// under a Suspense boundary.

export function useUiState<T extends string = string>(fallback?: T): T | undefined {
  const params = useSearchParams();
  if (process.env.NODE_ENV === "production") return fallback;
  const value = params.get("state");
  return (value as T | null) ?? fallback;
}
