"use client";

import { useSearchParams } from "next/navigation";

// Every page renders its named states, and ?state= forces one so a reviewer
// can see empty, loading, error or full without hacking fixtures. Components
// that call this must sit under a Suspense boundary.

export function useUiState<T extends string = string>(fallback?: T): T | undefined {
  const params = useSearchParams();
  const value = params.get("state");
  return (value as T | null) ?? fallback;
}
