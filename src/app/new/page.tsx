import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { NewClinicForm } from "./new-clinic-form";

export const metadata: Metadata = { title: "Set up your clinic" };

// Setting up a clinic is work, not a sign in, so it does not borrow the auth
// layout with its photograph. It is a page of its own: the form on the left,
// and on the right what the booking address will look like to a pet owner,
// updating as the name and the address are typed.

export default function NewClinicPage() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between px-5 md:h-20 md:px-8">
        <Lockup href="/" size="sm" />
        <Link href="/privacy" className="rounded-tag text-small font-medium text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
          Privacy
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[1040px] px-5 pb-24 md:px-8">
        <Suspense fallback={null}>
          <NewClinicForm />
        </Suspense>
      </main>
    </div>
  );
}
