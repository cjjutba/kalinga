import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { listMemberships } from "@/lib/session";
import { toOrganisation } from "@/lib/db/queries";
import { isRole } from "@/lib/roles";
import { ChooseClinic } from "./choose-clinic";

export const metadata: Metadata = { title: "Choose a clinic" };

// One membership goes straight in. Several get the list. None gets the
// invitation to create a clinic.

export default async function ChooseClinicPage() {
  const memberships = await listMemberships();
  if (memberships.length === 1) redirect(`/app/${memberships[0].org.slug}`);
  return (
    <AuthShell showCard={false}>
      <ChooseClinic memberships={memberships.map((m) => ({ organisation: toOrganisation(m.org), role: isRole(m.member.role) ? m.member.role : "front_desk" }))} />
    </AuthShell>
  );
}
