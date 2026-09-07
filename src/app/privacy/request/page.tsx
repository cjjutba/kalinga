import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/marketing/page-shell";
import { DeletionRequestForm } from "./request-form";

export const metadata: Metadata = { title: "Delete my data" };

export default function RequestPage() {
  return (
    <PageShell narrow action={{ label: "Privacy notice", href: "/privacy" }}>
      <Suspense fallback={null}>
        <DeletionRequestForm />
      </Suspense>
    </PageShell>
  );
}
