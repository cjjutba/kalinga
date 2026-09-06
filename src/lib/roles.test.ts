import { describe, expect, it } from "vitest";
import { can, staffRoles, type Permission, type Role } from "./roles";
import { permissionFor } from "./actions/permissions";

// One test per role asserting what it cannot reach, as docs/product/roles.md
// requires. The matrix is written out in full so a change to a grant has to
// be made twice, once in roles.ts and once here, on purpose.

const allPermissions: Permission[] = ["day_view", "manage_appointments", "view_clients", "edit_clients", "view_visit_notes", "add_visit", "view_recall", "view_settings", "view_audit", "privacy_requests"];

const cannot: Record<Role, Permission[]> = {
  owner: [],
  // Sees their own day and the animals in it. Cannot change staff, prices or
  // hours, cannot see the audit trail, and does not run the desk.
  vet: ["manage_appointments", "edit_clients", "view_recall", "view_settings", "view_audit", "privacy_requests"],
  // Runs the day. Cannot see or edit visit notes, cannot change staff or
  // prices, cannot see the audit trail.
  front_desk: ["view_visit_notes", "add_visit", "view_settings", "view_audit", "privacy_requests"],
};

describe("what each role cannot reach", () => {
  for (const role of staffRoles) {
    it(`${role} is denied exactly the listed permissions`, () => {
      const denied = allPermissions.filter((p) => !can(role, p));
      expect(denied.sort()).toEqual([...cannot[role]].sort());
    });
  }

  it("the owner holds every permission", () => {
    for (const p of allPermissions) expect(can("owner", p)).toBe(true);
  });

  it("an unknown role holds nothing", () => {
    for (const p of allPermissions) expect(can("pet_owner" as Role, p)).toBe(false);
  });
});

describe("what each role cannot do through applyAction", () => {
  const actions = Object.keys(permissionFor) as (keyof typeof permissionFor)[];
  const refused = (role: Role) => actions.filter((a) => !can(role, permissionFor[a])).sort();

  it("every command names a permission", () => {
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) expect(allPermissions).toContain(permissionFor[a]);
  });

  it("front desk cannot record visits or change the clinic", () => {
    expect(refused("front_desk")).toEqual(["invitation/cancel", "member/invite", "member/remove", "member/role", "org/update", "owner/delete", "provider/archive", "provider/upsert", "service/archive", "service/upsert", "visit/add"]);
  });

  it("a vet cannot run the desk or change the clinic", () => {
    expect(refused("vet")).toEqual(["appointment/create", "appointment/note", "appointment/reschedule", "appointment/status", "invitation/cancel", "member/invite", "member/remove", "member/role", "org/update", "owner/delete", "owner/upsert", "pet/upsert", "provider/archive", "provider/upsert", "reminder/email", "reminder/sent", "reminder/unsend", "service/archive", "service/upsert"]);
  });

  it("the owner is refused nothing", () => {
    expect(refused("owner")).toEqual([]);
  });
});
