import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/primitives/pill";
import { PageShell } from "@/components/marketing/page-shell";

// Most people who land here followed a clinic's booking link that has changed.
// So the page says that plainly and offers the two things they might want,
// rather than an apology and a back button.

export default function NotFound() {
  return (
    <PageShell narrow>
      <p className="text-label font-medium uppercase tracking-[0.08em] text-text-2">404</p>
      <h1 className="mt-2 text-[32px] font-medium leading-[1.15] tracking-[-0.015em] text-balance">That page does not exist</h1>
      <p className="mt-4 text-body leading-[1.6] text-text-2">
        The link may be old, or the clinic may have changed its booking address. Nothing has been lost. If you were trying to reach a clinic, ask them for their current link.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Pill asChild>
          <Link href="/">
            Back to Kalinga <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
          </Link>
        </Pill>
        <Pill asChild variant="secondary">
          <Link href="/sign-in">Staff sign in</Link>
        </Pill>
      </div>
    </PageShell>
  );
}
