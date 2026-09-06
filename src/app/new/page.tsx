import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { mayCreateOrganisation } from "@/lib/session";
import { NewClinicForm } from "./new-clinic-form";

export const metadata: Metadata = { title: "Set up your clinic" };

// Setting up a clinic is work, not a sign in, so it does not borrow the auth
// layout with its photograph. It is a page of its own: the form on the left,
// and on the right what the booking address will look like to a pet owner,
// updating as the name and the address are typed.

export default async function NewClinicPage() {
  // The same rule the auth plugin enforces, so the page says it in words
  // rather than letting the button fail.
  const allowed = await mayCreateOrganisation();
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between px-5 md:h-20 md:px-8">
        <Lockup href="/" size="sm" />
        <Link href="/privacy" className="rounded-tag text-small font-medium text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
          Privacy
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[1040px] px-5 pb-24 md:px-8">
        {allowed ? (
          <Suspense fallback={null}>
            <NewClinicForm />
          </Suspense>
        ) : (
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
        )}
      </main>
    </div>
  );
}
