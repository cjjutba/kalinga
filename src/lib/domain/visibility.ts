import { can, type Role } from "@/lib/roles";
import type { OrgSnapshot } from "./types";

// What a role may receive, applied before anything leaves the server. Hiding
// a button is not a permission, and neither is a payload the browser happens
// not to draw. Pure so it can be tested per role without a database.

export function visibleSnapshot(snapshot: OrgSnapshot, role: Role): OrgSnapshot {
  return {
    ...snapshot,
    invitations: can(role, "view_settings") ? snapshot.invitations : [],
    visits: can(role, "view_visit_notes") ? snapshot.visits : snapshot.visits.map((v) => ({ ...v, notes: "" })),
    audit: can(role, "view_audit") ? snapshot.audit : [],
  };
}
