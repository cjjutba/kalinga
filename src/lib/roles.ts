import type { Role } from "@/lib/mock/types";

// What each role can reach, from docs/product/roles.md. In the prototype this
// only decides what the navigation shows and which pages render a "not for
// your role" state. Real enforcement happens on the server in F6, and hiding a
// button is not a permission.

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
  | "view_portal";

const grants: Record<Role, Permission[]> = {
  owner: [
    "day_view",
    "manage_appointments",
    "view_clients",
    "edit_clients",
    "view_visit_notes",
    "add_visit",
    "view_recall",
    "view_settings",
    "view_audit",
  ],
  vet: ["day_view", "view_clients", "view_visit_notes", "add_visit"],
  front_desk: ["day_view", "manage_appointments", "view_clients", "edit_clients", "view_recall"],
  pet_owner: ["view_portal"],
};

export function can(role: Role, permission: Permission): boolean {
  return grants[role].includes(permission);
}

export const roleLabel: Record<Role, string> = {
  owner: "Owner",
  vet: "Vet",
  front_desk: "Front desk",
  pet_owner: "Pet owner",
};

export const roleDescription: Record<Role, string> = {
  owner: "Runs the business. Sees everything the clinic holds.",
  vet: "Sees their own day and the animals in it. Adds visit notes, weight and vaccination dates.",
  front_desk: "Runs the day. Books, reschedules, checks pets in and works the recall queue.",
  pet_owner: "Books without an account. Sees their own pets and appointments.",
};

export const staffRoles: Role[] = ["owner", "vet", "front_desk"];
export const allRoles: Role[] = ["owner", "vet", "front_desk", "pet_owner"];
