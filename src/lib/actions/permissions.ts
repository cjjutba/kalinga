import type { Permission } from "@/lib/roles";
import type { StoreAction } from "./types";

// Which permission each command needs. Checked in applyAction before the
// handler runs. Kept apart from the server action module so the per role
// tests can read it without pulling in the database or Next.

export const permissionFor: Record<StoreAction["type"], Permission> = {
  "appointment/status": "manage_appointments",
  "appointment/reschedule": "manage_appointments",
  "appointment/create": "manage_appointments",
  "appointment/note": "manage_appointments",
  "visit/add": "add_visit",
  "owner/upsert": "edit_clients",
  "pet/upsert": "edit_clients",
  "service/upsert": "view_settings",
  "service/archive": "view_settings",
  "provider/upsert": "view_settings",
  "provider/archive": "view_settings",
  "member/invite": "view_settings",
  "member/role": "view_settings",
  "member/remove": "view_settings",
  "invitation/cancel": "view_settings",
  "reminder/sent": "view_recall",
  "reminder/unsend": "view_recall",
  "org/update": "view_settings",
};
