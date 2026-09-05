import type { Metadata } from "next";
import { Suspense } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DeletionRequestForm } from "./request-form";

export const metadata: Metadata = { title: "Delete my data" };

export default function RequestPage() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex w-full max-w-3xl items-center px-5 py-5">
        <Lockup href="/" />
      </header>
      <main className="mx-auto w-full max-w-lg px-5 pb-16 pt-6">
        <Suspense fallback={null}>
          <DeletionRequestForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
