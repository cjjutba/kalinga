import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesSettings } from "@/components/staff/settings";

export const metadata: Metadata = { title: "Services" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <ServicesSettings orgSlug={org} />
    </Suspense>
  );
}
