import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientsList } from "@/components/staff/clients";

export const metadata: Metadata = { title: "Clients" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <ClientsList orgSlug={org} />
    </Suspense>
  );
}
