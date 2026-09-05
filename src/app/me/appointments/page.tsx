import type { Metadata } from "next";
import { PortalAppointments } from "@/components/portal/portal-pages";
import { getPortalData } from "@/lib/db/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Appointments" };

export default async function Page() {
  const session = await requireSession();
  const data = await getPortalData(session.user.email);
  return <PortalAppointments data={data} name={session.user.name || data.owners[0]?.name || ""} />;
}
