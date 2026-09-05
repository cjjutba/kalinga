import type { Metadata } from "next";
import { PortalPets } from "@/components/portal/portal-pages";
import { getPortalData } from "@/lib/db/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "My pets" };

export default async function Page() {
  const session = await requireSession();
  const data = await getPortalData(session.user.email);
  return <PortalPets data={data} />;
}
