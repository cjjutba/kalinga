import type { Metadata } from "next";
import { Suspense } from "react";
import { ReminderLog } from "@/components/staff/recall";

export const metadata: Metadata = { title: "Reminder log" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <ReminderLog orgSlug={org} />
    </Suspense>
  );
}
