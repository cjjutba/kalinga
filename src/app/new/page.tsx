import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { getSession, listMemberships, mayCreateOrganisation } from "@/lib/session";
import { Onboarding } from "@/components/clinic/onboarding";

export const metadata: Metadata = { title: "Set up your clinic" };

// Setting up a clinic is work, not a sign in, so it does not borrow the auth
// layout with its photograph. It is the same stepped flow a pet owner books
// in: a rail of what is left, one thing on screen at a time, and every step
// after the first optional.

export default async function NewClinicPage() {
  // Signed out, this page has nothing to offer, and coming back to it after
  // signing in is the whole point of getting sent away.
  if (!(await getSession())) redirect("/sign-in?next=/new");
  // The same rule the auth plugin enforces, so the page says it in words
  // rather than letting the button fail.
  const allowed = await mayCreateOrganisation();
  const memberships = await listMemberships();
  if (!allowed) {
    return (
      <div className="min-h-dvh bg-page">
        <header className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between px-5 md:h-20 md:px-8">
          <Lockup href="/" size="sm" />
          <Link href="/privacy" className="rounded-tag text-small font-medium text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
            Privacy
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1040px] px-5 pb-24 md:px-8">
          <div className="mx-auto max-w-lg rounded-card bg-sheet p-6 text-center">
            <h1 className="text-heading font-medium">Only an owner opens a clinic</h1>
            <p className="mt-2 text-small text-text-2">
              You work at a clinic someone else owns. Ask them to add what you need, or sign in with your own account to start one.
            </p>
            <div className="mt-5">
              <Pill asChild size="sm" variant="secondary">
                <Link href="/app">Back to your clinic</Link>
              </Pill>
            </div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <Suspense fallback={null}>
      <Onboarding hasClinics={memberships.length > 0} />
    </Suspense>
  );
}
