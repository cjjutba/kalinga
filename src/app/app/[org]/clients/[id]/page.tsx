import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientDetail } from "@/components/staff/clients";

export const metadata: Metadata = { title: "Client" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  return (
    <Suspense fallback={null}>
      <ClientDetail orgSlug={org} id={id} />
    </Suspense>
  );
}
