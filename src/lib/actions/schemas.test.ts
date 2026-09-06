import { describe, expect, it } from "vitest";
import { bookingInput, manageInput } from "./schemas";

// The unauthenticated write path validates before it touches the database.
// These pin the honeypot, the mobile format and the contact details.

const good = {
  orgSlug: "lunhaw",
  serviceId: "svc-1",
  providerId: "prov-1",
  startsAt: "2026-09-08T01:00:00.000Z",
  name: "Rosa Villanueva",
  mobile: "0917 555 0142",
  email: "rosa@lunhaw.test",
  petName: "Kiko",
  species: "dog",
  notes: "First vaccination.",
  website: "",
};

describe("bookingInput", () => {
  it("accepts a real booking", () => {
    expect(bookingInput.safeParse(good).success).toBe(true);
  });

  it("refuses anything that filled the honeypot", () => {
    expect(bookingInput.safeParse({ ...good, website: "http://spam.example" }).success).toBe(false);
  });

  it("accepts the start time with a clinic offset as well as UTC", () => {
    expect(bookingInput.safeParse({ ...good, startsAt: "2026-09-08T09:00:00.000+08:00" }).success).toBe(true);
    expect(bookingInput.safeParse({ ...good, startsAt: "tomorrow at nine" }).success).toBe(false);
  });

  it("wants a Philippine mobile number as people type it", () => {
    for (const mobile of ["0917 555 0142", "09175550142", "0917-555-0142".replace(/-/g, " ")]) {
      expect(bookingInput.safeParse({ ...good, mobile }).success, mobile).toBe(true);
    }
    for (const mobile of ["12345", "call me", "+63 917 555 0142", ""]) {
      expect(bookingInput.safeParse({ ...good, mobile }).success, mobile).toBe(false);
    }
  });

  it("needs a real email, because the confirmation and reminders go there", () => {
    expect(bookingInput.safeParse({ ...good, email: "" }).success).toBe(false);
    expect(bookingInput.safeParse({ ...good, email: undefined }).success).toBe(false);
    expect(bookingInput.safeParse({ ...good, email: "not an email" }).success).toBe(false);
    expect(bookingInput.safeParse(good).success).toBe(true);
  });

  it("only knows dogs and cats in v1", () => {
    expect(bookingInput.safeParse({ ...good, species: "parrot" }).success).toBe(false);
  });

  it("trims and bounds the free text", () => {
    const parsed = bookingInput.safeParse({ ...good, name: "  Rosa  ", notes: "x".repeat(2001) });
    expect(parsed.success).toBe(false);
    const ok = bookingInput.safeParse({ ...good, name: "  Rosa  " });
    expect(ok.success && ok.data.name).toBe("Rosa");
  });
});

describe("manageInput", () => {
  it("takes a clinic slug and a reference", () => {
    expect(manageInput.safeParse({ orgSlug: "lunhaw", reference: "KLG-43VG" }).success).toBe(true);
    expect(manageInput.safeParse({ orgSlug: "", reference: "KLG-43VG" }).success).toBe(false);
    expect(manageInput.safeParse({ orgSlug: "lunhaw", reference: "K" }).success).toBe(false);
  });
});
