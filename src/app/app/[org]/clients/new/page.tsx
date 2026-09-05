import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientForm } from "@/components/staff/clients";

export const metadata: Metadata = { title: "New client" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <ClientForm orgSlug={org} />
    </Suspense>
  );
}
