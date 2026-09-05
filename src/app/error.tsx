"use client";

import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <Lockup href="/" />
      <div>
        <h1 className="text-title font-medium">Something went wrong</h1>
        <p className="mt-2 text-body text-text-2">Nothing you entered has been lost. Try again, and if it happens twice, the clinic can reach us from the privacy page.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Pill block onClick={reset}>
          Try again
        </Pill>
        <Pill asChild block variant="secondary">
          <Link href="/">Back to Kalinga</Link>
        </Pill>
      </div>
    </main>
  );
}
