"use client";

import Link from "next/link";
import { Pill } from "@/components/primitives/pill";
import { PageShell } from "@/components/marketing/page-shell";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell narrow>
      <p className="text-label font-medium uppercase tracking-[0.08em] text-text-2">Something broke</p>
      <h1 className="mt-2 text-[32px] font-medium leading-[1.15] tracking-[-0.015em] text-balance">This page did not load</h1>
      <p className="mt-4 text-body leading-[1.6] text-text-2">
        Nothing you entered has been lost. Try again, and if it happens twice, tell us from the privacy page and we will look at it.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Pill onClick={reset}>Try again</Pill>
        <Pill asChild variant="secondary">
          <Link href="/">Back to Kalinga</Link>
        </Pill>
      </div>
    </PageShell>
  );
}
