import type { Metadata } from "next";
import { PortalPet } from "@/components/portal/portal-pages";
import { getPortalData } from "@/lib/db/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Pet" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const data = await getPortalData(session.user.email);
  return <PortalPet data={data} id={id} />;
}
