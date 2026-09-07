import Link from "next/link";
import type { ReactNode } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { SiteFooter } from "@/components/marketing/site-footer";

// The frame the short public pages share: a deletion request, a page that does
// not exist, a page that broke. Each of them used to invent its own header and
// its own width, which is how three pages end up looking like three products.

export function PageShell({
  children,
  action,
  narrow = false,
}: {
  children: ReactNode;
  /** The one thing on the right of the header, if there is one. */
  action?: { label: string; href: string };
  /** A form or a message rather than a document. */
  narrow?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="border-b border-divider">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 md:px-8">
          <Lockup href="/" size="sm" />
          {action ? (
            <Pill asChild size="sm" variant="secondary">
              <Link href={action.href}>{action.label}</Link>
            </Pill>
          ) : null}
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-5 pb-20 pt-12 md:px-8 md:pt-16 ${narrow ? "max-w-lg" : "max-w-5xl"}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}
