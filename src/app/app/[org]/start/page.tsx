import type { Metadata } from "next";
import { Suspense } from "react";
import { FirstRun } from "@/components/staff/first-run";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Setup guide" };

// The same checklist a new clinic lands on, kept at an address of its own so
// anyone who skipped a step during setup can come back to it from the portal
// rather than hunting through Settings for what is missing.

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const actor = await requirePagePermission(org, "day_view");
  return (
    <Suspense fallback={null}>
      <FirstRun orgSlug={org} clinicName={actor.org.name} />
    </Suspense>
  );
}
