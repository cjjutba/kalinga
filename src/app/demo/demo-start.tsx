"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/primitives/pill";
import { useStore } from "@/lib/mock/store";

// A form that POSTs, in shape. In the real build the action creates a seeded
// tenant and sets the cookie. In the prototype it resets the store, starts as
// the owner and opens the day view with the tour.

export function DemoStart() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [loading, setLoading] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    dispatch({ type: "reset" });
    dispatch({ type: "role/set", role: "owner" });
    window.setTimeout(() => router.push("/app/lunhaw?tour=1"), 500);
  }
  return (
    <form method="post" action="/demo" onSubmit={submit} className="mt-6">
      <Pill type="submit" loading={loading} loadingLabel="Setting up your clinic" className="w-full sm:w-auto">
        Open the sandbox
      </Pill>
    </form>
  );
}
