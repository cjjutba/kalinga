import type { Role } from "@/lib/domain/types";

// What each role can reach, from docs/product/roles.md. Checked on the server
// at the top of every action through requirePermission, and read in the
// browser only to decide what the navigation shows. Hiding a button is not a
// permission. Pet owners are not a role: they are never members of a clinic.

export type { Role };

export type Permission =
  | "day_view"
  | "manage_appointments"
  | "view_clients"
  | "edit_clients"
  | "view_visit_notes"
  | "add_visit"
  | "view_recall"
  | "view_settings"
  | "view_audit"
  /** Export a client's record and delete it. The owner alone removes data. */
  | "privacy_requests";

const grants: Record<Role, Permission[]> = {
  owner: ["day_view", "manage_appointments", "view_clients", "edit_clients", "view_visit_notes", "add_visit", "view_recall", "view_settings", "view_audit", "privacy_requests"],
  vet: ["day_view", "view_clients", "view_visit_notes", "add_visit"],
  front_desk: ["day_view", "manage_appointments", "view_clients", "edit_clients", "view_recall"],
};

export function can(role: Role, permission: Permission): boolean {
  return (grants[role] ?? []).includes(permission);
}

export function isRole(value: string): value is Role {
  return value === "owner" || value === "vet" || value === "front_desk";
}

export const roleLabel: Record<Role, string> = {
  owner: "Owner",
  vet: "Vet",
  front_desk: "Front desk",
};

export const roleDescription: Record<Role, string> = {
  owner: "Runs the business. Sees everything the clinic holds and is the only role that removes data.",
  vet: "Sees their own day and the animals in it. Adds visit notes, weight and vaccination dates.",
  front_desk: "Runs the day. Books, reschedules, checks pets in and works the recall queue.",
};

export const staffRoles: Role[] = ["owner", "vet", "front_desk"];
