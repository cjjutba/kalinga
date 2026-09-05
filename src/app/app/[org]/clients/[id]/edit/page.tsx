import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientForm } from "@/components/staff/clients";

export const metadata: Metadata = { title: "Edit client" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  return (
    <Suspense fallback={null}>
      <ClientForm orgSlug={org} id={id} />
    </Suspense>
  );
}
