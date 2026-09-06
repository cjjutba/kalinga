import { describe, expect, it } from "vitest";
import { visibleSnapshot } from "./visibility";
import type { OrgSnapshot } from "./types";

// The payload the staff shell receives is filtered by role before it leaves
// the server. These tests pin down what each role never receives.

const snapshot = {
  organisation: { id: "org-1", slug: "lunhaw", name: "Lunhaw Animal Clinic" },
  members: [{ id: "m-1" }],
  invitations: [{ id: "inv-1", email: "maria@lunhaw.test" }],
  services: [],
  providers: [],
  owners: [],
  pets: [],
  appointments: [],
  visits: [
    { id: "v-1", organisationId: "org-1", appointmentId: "a-1", petId: "p-1", providerId: "pr-1", at: "2026-09-06T00:00:00.000Z", weightKg: 12.4, notes: "Small cut on the left hind paw pad.", administered: ["Wound dressing"] },
  ],
  reminders: [],
  audit: [{ id: "e-1", action: "Cancelled appointment" }],
} as unknown as OrgSnapshot;

describe("visibleSnapshot", () => {
  it("gives the owner everything", () => {
    const out = visibleSnapshot(snapshot, "owner");
    expect(out.audit).toHaveLength(1);
    expect(out.invitations).toHaveLength(1);
    expect(out.visits[0].notes).toBe("Small cut on the left hind paw pad.");
  });

  it("keeps the audit trail and invitations from a vet, but not the notes", () => {
    const out = visibleSnapshot(snapshot, "vet");
    expect(out.audit).toEqual([]);
    expect(out.invitations).toEqual([]);
    expect(out.visits[0].notes).toBe("Small cut on the left hind paw pad.");
  });

  it("blanks visit notes for the front desk and keeps the rest of the visit", () => {
    const out = visibleSnapshot(snapshot, "front_desk");
    expect(out.audit).toEqual([]);
    expect(out.invitations).toEqual([]);
    expect(out.visits).toHaveLength(1);
    expect(out.visits[0].notes).toBe("");
    expect(out.visits[0].weightKg).toBe(12.4);
    expect(out.visits[0].administered).toEqual(["Wound dressing"]);
  });

  it("does not mutate the input", () => {
    visibleSnapshot(snapshot, "front_desk");
    expect(snapshot.visits[0].notes).toBe("Small cut on the left hind paw pad.");
    expect(snapshot.audit).toHaveLength(1);
  });
});
