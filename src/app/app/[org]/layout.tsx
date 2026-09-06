import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff/shell";
import { OrgDataProvider } from "@/lib/org-data";
import { loadOrgSnapshot, toOrganisation } from "@/lib/db/queries";
import { listMemberships, requireMember } from "@/lib/session";
import { isRole } from "@/lib/roles";
import { emailIsConfigured } from "@/lib/email";

// Every staff page sits under this layout. The membership is checked on the
// server, the organisation's data is loaded through its scope, and the
// browser receives plain view models. Nothing here trusts the URL alone.

export default async function OrgLayout({ children, params }: { children: ReactNode; params: Promise<{ org: string }> }) {
  const { org } = await params;
  const actor = await requireMember(org);
  const [snapshot, memberships] = await Promise.all([loadOrgSnapshot(actor.org, actor.role), listMemberships()]);
  return (
    <OrgDataProvider
      snapshot={snapshot}
      role={actor.role}
      actorMemberId={actor.member.id}
      emailConfigured={emailIsConfigured()}
      memberships={memberships.map((m) => ({ organisation: toOrganisation(m.org), role: isRole(m.member.role) ? m.member.role : "front_desk" }))}
    >
      <StaffShell userName={actor.session.user.name}>{children}</StaffShell>
    </OrgDataProvider>
  );
}
