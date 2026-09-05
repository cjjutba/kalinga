"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// The pet owner's side. A phone first shell with two tabs. The person here
// reaches almost nothing, which is the point.

export function PortalShell({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tabs = [
    { href: "/me/appointments", label: "Appointments" },
    { href: "/me/pets", label: "My pets" },
  ];
  async function signOut() {
    await authClient.signOut();
    router.push("/me");
    router.refresh();
  }
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-5">
        <Lockup href="/" size="sm" />
        {signedIn ? (
          <button type="button" onClick={signOut} className="text-small font-medium text-text-2 hover:text-text">
            Sign out
          </button>
        ) : null}
      </header>
      {signedIn ? (
        <nav aria-label="Your Kalinga" className="mx-auto mt-5 flex w-full max-w-xl gap-1.5 px-5">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "h-9 rounded-full px-4 text-small font-medium leading-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                  active ? "bg-action text-on-action" : "bg-sheet text-text-2 hover:text-text",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
      <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-6">{children}</main>
    </div>
  );
}
