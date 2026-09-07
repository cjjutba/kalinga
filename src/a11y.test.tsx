// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import axe from "axe-core";
import { addDays, addHours, formatISO, startOfDay, subDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

// The accessibility gate AGENTS.md promises: every screen rendered with
// realistic data and checked by axe against WCAG 2 A and AA, failing the
// build on any violation. The DOM here has no stylesheet, so colour contrast
// cannot be measured and stays with the token table in DESIGN.md. Everything
// structural is covered: names, labels, roles, headings, landmarks, focus
// order hints and ARIA use. The data below is test input, not seed data:
// nothing here reaches a database.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/app/lunhaw",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: () => {
    throw new Error("redirect");
  },
  forbidden: () => {
    throw new Error("forbidden");
  },
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", resolvedTheme: "light", setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { email: vi.fn(), magicLink: vi.fn() }, signUp: { email: vi.fn() }, signOut: vi.fn(), requestPasswordReset: vi.fn(), resetPassword: vi.fn(), organization: { create: vi.fn(), setActive: vi.fn(), checkSlug: vi.fn(), acceptInvitation: vi.fn() } },
}));
vi.mock("@/lib/actions/apply", () => ({ applyAction: vi.fn(), findAppointmentReference: vi.fn() }));
vi.mock("@/lib/actions/slots", () => ({ getStaffSlots: vi.fn(), getPublicSlots: vi.fn() }));
vi.mock("@/lib/actions/public", () => ({ bookAppointment: vi.fn(), cancelBooking: vi.fn(), rescheduleBooking: vi.fn() }));
vi.mock("@/lib/actions/privacy", () => ({ submitPrivacyRequest: vi.fn() }));

import type { OrgSnapshot, Role } from "@/lib/domain/types";
import { OrgDataProvider } from "@/lib/org-data";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/app/sign-in/sign-in-form";
import { SignUpForm } from "@/app/sign-up/sign-up-form";
import { ResetFlow } from "@/app/reset/reset-flow";
import { ClinicForm } from "@/components/clinic/clinic-form";
import { InviteForm } from "@/app/invite/[token]/invite-form";
import { ChooseClinic } from "@/app/app/choose-clinic";
import Forbidden from "@/app/app/[org]/forbidden";
import Home from "@/app/page";
import PrivacyPage from "@/app/privacy/page";
import NotFound from "@/app/not-found";
import { DeletionRequestForm } from "@/app/privacy/request/request-form";
import { StaffShell } from "@/components/staff/shell";
import { DayView } from "@/components/staff/day-view";
import { FirstRun } from "@/components/staff/first-run";
import { ClientsList, ClientDetail, ClientForm } from "@/components/staff/clients";
import { ClientExport } from "@/components/staff/client-export";
import { PetsList, PetRecord, PetForm, VisitDetail } from "@/components/staff/pets";
import { VisitForm } from "@/components/staff/visit-form";
import { RecallQueue, ReminderLog } from "@/components/staff/recall";
import { ClinicSettings, ServicesSettings, StaffSettings, HoursSettings, ClosuresSettings, RecallSettings } from "@/components/staff/settings";
import { AuditTrail, AuditEventDetail } from "@/components/staff/audit";
import { ClinicPage } from "@/components/booking/clinic-page";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BookingConfirmation } from "@/components/booking/confirmation";
import { SlotPicker } from "@/components/booking/slot-picker";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalSignIn, PortalAppointments, PortalAppointment, PortalPets, PortalPet } from "@/components/portal/portal-pages";

// ---------------------------------------------------------------------------
// Test data. Invented clinic, invented people, dates relative to now.
// ---------------------------------------------------------------------------

const now = new Date();
const iso = (d: Date) => d.toISOString();
// Fixture days are built in the clinic's zone, never the runner's. A build
// machine on UTC starting after four in the afternoon is already tomorrow in
// Manila, and the day view groups by clinic time, so plain local arithmetic
// here moved today's appointments to yesterday and the screens under test
// rendered a different day.
const clinicDay = (offset: number) => startOfDay(addDays(new TZDate(now, "Asia/Manila"), offset));
const day = (offset: number, hour: number) => iso(addHours(clinicDay(offset), hour));
const date = (offset: number) => formatISO(clinicDay(offset), { representation: "date" });
const ORG = "org-lunhaw";

const snapshot: OrgSnapshot = {
  organisation: { id: ORG, slug: "lunhaw", name: "Lunhaw Animal Clinic", city: "Cagayan de Oro", address: "Door 3, Velez corner Capistrano", mobile: "0917 555 0100", email: "hello@lunhaw.test", timezone: "Asia/Manila", openFrom: "09:00", openTo: "18:00", groomingIntervalWeeks: 5, vaccinationIntervalMonths: 12, dewormingIntervalMonths: 3 },
  members: [
    { id: "m-owner", organisationId: ORG, userId: "u1", name: "Dr. Ana Reyes", email: "ana@lunhaw.test", role: "owner", providerId: "pr-ana", invitedAt: iso(subDays(now, 40)) },
    { id: "m-vet", organisationId: ORG, userId: "u2", name: "Dr. Paolo Dimaculangan", email: "paolo@lunhaw.test", role: "vet", providerId: "pr-paolo", invitedAt: iso(subDays(now, 30)) },
    { id: "m-desk", organisationId: ORG, userId: "u3", name: "Maria Santos", email: "maria@lunhaw.test", role: "front_desk", invitedAt: iso(subDays(now, 20)) },
  ],
  invitations: [{ id: "inv-1", organisationId: ORG, email: "jess@lunhaw.test", role: "vet", status: "pending", expiresAt: iso(addDays(now, 6)), createdAt: iso(subDays(now, 1)) }],
  services: [
    { id: "svc-vax", organisationId: ORG, name: "Vaccination", durationMin: 30, bufferMin: 5, pricePhp: 650, publiclyBookable: true, recallKind: "vaccination" },
    { id: "svc-consult", organisationId: ORG, name: "Consultation", durationMin: 20, bufferMin: 0, pricePhp: 400, publiclyBookable: true },
    { id: "svc-groom", organisationId: ORG, name: "Full groom", durationMin: 60, bufferMin: 10, pricePhp: 900, publiclyBookable: false, recallKind: "grooming" },
  ],
  providers: [
    { id: "pr-ana", organisationId: ORG, name: "Dr. Ana Reyes", title: "Vet", memberId: "m-owner", weeklyHours: [1, 2, 3, 4, 5, 6].map((d) => ({ day: d, from: "09:00", to: "18:00" })), exceptions: [{ date: date(3), reason: "Fiesta, clinic closed" }] },
    { id: "pr-paolo", organisationId: ORG, name: "Dr. Paolo Dimaculangan", title: "Vet", memberId: "m-vet", weeklyHours: [1, 3, 5].map((d) => ({ day: d, from: "13:00", to: "18:00" })), exceptions: [] },
  ],
  owners: [
    { id: "o-rosa", organisationId: ORG, name: "Rosa Villanueva", mobile: "0917 555 0142", email: "rosa@lunhaw.test", createdAt: iso(subDays(now, 12)) },
    { id: "o-long", organisationId: ORG, name: "Maria Consolacion Villafuerte de los Santos", mobile: "0918 555 0199", notes: "Prefers Messenger. Works nights.", createdAt: iso(subDays(now, 90)) },
    { id: "o-nomobile", organisationId: ORG, name: "Ben Ocampo", createdAt: iso(subDays(now, 2)) },
  ],
  pets: [
    { id: "p-kiko", organisationId: ORG, ownerId: "o-rosa", name: "Kiko", species: "dog", breed: "Aspin", sex: "male", birthDate: date(-800), weightKg: 12.6, lastVaccination: date(-360), notes: "Nervous with strangers." },
    { id: "p-ming", organisationId: ORG, ownerId: "o-long", name: "Mingming", species: "cat", breed: "Puspin", sex: "female", birthDate: "", weightKg: 3.8, lastDeworming: date(-85), lastGroom: date(-40) },
    { id: "p-bantay", organisationId: ORG, ownerId: "o-nomobile", name: "Bantay", species: "dog", breed: "Aspin", sex: "male", birthDate: date(-200) },
  ],
  appointments: [
    { id: "a-1", organisationId: ORG, reference: "KLG-43VG", ownerId: "o-rosa", petId: "p-kiko", serviceId: "svc-vax", providerId: "pr-ana", startsAt: day(0, 1), endsAt: day(0, 1.5), status: "confirmed", source: "online", note: "First vaccination since we adopted him.", createdAt: iso(subDays(now, 3)) },
    { id: "a-2", organisationId: ORG, reference: "KLG-7EPA", ownerId: "o-long", petId: "p-ming", serviceId: "svc-consult", providerId: "pr-paolo", startsAt: day(0, 5), endsAt: day(0, 5.5), status: "booked", source: "staff", createdAt: iso(subDays(now, 1)) },
    { id: "a-3", organisationId: ORG, reference: "KLG-F64Y", ownerId: "o-nomobile", petId: "p-bantay", serviceId: null, providerId: "pr-ana", startsAt: day(0, 2), endsAt: day(0, 2.5), status: "arrived", source: "walk_in", note: "Limping on the left hind leg.", createdAt: iso(now) },
    { id: "a-4", organisationId: ORG, reference: "KLG-VGZC", ownerId: "o-rosa", petId: "p-kiko", serviceId: "svc-vax", providerId: "pr-ana", startsAt: day(0, 3), endsAt: day(0, 3.5), status: "cancelled", source: "staff", cancelReason: "Owner rescheduled by phone", createdAt: iso(subDays(now, 2)) },
    { id: "a-5", organisationId: ORG, reference: "KLG-2K9M", ownerId: "o-long", petId: "p-ming", serviceId: "svc-groom", providerId: "pr-ana", startsAt: day(-1, 2), endsAt: day(-1, 3), status: "no_show", source: "online", createdAt: iso(subDays(now, 5)) },
    { id: "a-6", organisationId: ORG, reference: "KLG-PQ3T", ownerId: "o-rosa", petId: "p-kiko", serviceId: "svc-vax", providerId: "pr-ana", startsAt: day(-30, 2), endsAt: day(-30, 2.5), status: "completed", source: "online", createdAt: iso(subDays(now, 33)) },
    { id: "a-7", organisationId: ORG, reference: "KLG-8HD2", ownerId: "o-nomobile", petId: "p-bantay", serviceId: "svc-consult", providerId: "pr-paolo", startsAt: day(2, 5), endsAt: day(2, 5.5), status: "booked", source: "online", createdAt: iso(now) },
  ],
  visits: [
    { id: "v-1", organisationId: ORG, appointmentId: "a-6", petId: "p-kiko", providerId: "pr-ana", at: day(-30, 2), weightKg: 12.4, notes: "Bright and alert. First shot of the series.", administered: ["5-in-1 vaccine"], paymentMethod: "cash" },
    { id: "v-2", organisationId: ORG, appointmentId: "a-3", petId: "p-bantay", providerId: "pr-ana", at: day(0, 2), weightKg: 18, notes: "Small cut on the left hind paw pad. Cleaned and dressed.", administered: ["Wound dressing"], paymentMethod: "gcash", paymentRef: "GC7781234" },
  ],
  reminders: [
    { id: "r-1", organisationId: ORG, petId: "p-kiko", kind: "vaccination", dueOn: date(5), message: "Hi Rosa, this is Lunhaw Animal Clinic. Kiko's annual vaccination is due soon.", generatedAt: iso(subDays(now, 1)) },
    { id: "r-2", organisationId: ORG, petId: "p-ming", kind: "deworming", dueOn: date(-2), message: "Hi Maria, Lunhaw Animal Clinic here. Mingming is due for deworming.", generatedAt: iso(subDays(now, 3)), sentAt: iso(subDays(now, 1)), sentByMemberId: "m-desk", sentVia: "email" },
    { id: "r-3", organisationId: ORG, petId: "p-ming", kind: "grooming", dueOn: date(1), message: "Hi Maria, it's Lunhaw Animal Clinic. Mingming is about due for a groom.", generatedAt: iso(subDays(now, 2)), sentAt: iso(now), sentByMemberId: "m-desk", sentVia: "copied" },
  ],
  audit: [
    { id: "e-1", organisationId: ORG, actorMemberId: "m-owner", actorName: "Dr. Ana Reyes", action: "Cancelled appointment", entityType: "appointment", entityId: "a-4", entityLabel: "Kiko, Vaccination", before: { status: "booked" }, after: { status: "cancelled", reason: "Owner rescheduled by phone" }, at: iso(subDays(now, 1)) },
    { id: "e-2", organisationId: ORG, actorMemberId: "", actorName: "Rosa Villanueva", action: "Booked online", entityType: "appointment", entityId: "a-1", entityLabel: "Kiko, Vaccination", after: { status: "booked" }, at: iso(subDays(now, 3)) },
    { id: "e-3", organisationId: ORG, actorMemberId: "m-desk", actorName: "Maria Santos", action: "Emailed reminder", entityType: "reminder", entityId: "r-2", entityLabel: "Mingming, deworming", after: { to: "maria@example.test" }, at: iso(subDays(now, 1)) },
  ],
};

const emptySnapshot: OrgSnapshot = { ...snapshot, services: [], providers: [], owners: [], pets: [], appointments: [], visits: [], reminders: [], audit: [], invitations: [] };

const publicClinic = { organisation: snapshot.organisation, services: snapshot.services.filter((s) => s.publiclyBookable), providers: snapshot.providers };
const booking = { organisation: snapshot.organisation, appointment: snapshot.appointments[0], pet: snapshot.pets[0], owner: snapshot.owners[0], service: snapshot.services[0], provider: snapshot.providers[0] };
const portalData = { organisations: [snapshot.organisation], owners: [snapshot.owners[0]], pets: [snapshot.pets[0]], appointments: snapshot.appointments.filter((a) => a.ownerId === "o-rosa"), visits: snapshot.visits.filter((v) => v.petId === "p-kiko"), services: snapshot.services, providers: snapshot.providers };
const invitation = { id: "inv-1", email: "jess@lunhaw.test", role: "vet" as Role, status: "pending", expired: false, clinic: "Lunhaw Animal Clinic", slug: "lunhaw", inviter: "Dr. Ana Reyes" };

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function Staff({ role = "owner", data = snapshot, children }: { role?: Role; data?: OrgSnapshot; children: ReactNode }) {
  return (
    <OrgDataProvider snapshot={data} role={role} actorMemberId={role === "owner" ? "m-owner" : role === "vet" ? "m-vet" : "m-desk"} memberships={[{ organisation: data.organisation, role }]} emailConfigured={true}>
      {children}
    </OrgDataProvider>
  );
}

async function violations(el: ReactElement, wholePage = false): Promise<string> {
  const markup = renderToStaticMarkup(el);
  document.body.innerHTML = wholePage ? markup : `<main>${markup}</main>`;
  const results = await axe.run(document.body, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    // No stylesheet is loaded here, so contrast is unmeasurable. It is held by
    // the token table in DESIGN.md and was measured with axe in a browser.
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.slice(0, 3).map((n) => `    ${n.html.slice(0, 200)}`).join("\n")}`).join("\n");
}

// Render functions rather than elements, so each test builds a fresh tree and
// the array is not a list of keyless children.
const screens: [string, () => ReactElement, boolean?][] = [
  // Marketing and legal, whole pages.
  ["landing page", () => <Home />, true],
  ["privacy notice", () => <PrivacyPage />, true],
  ["not found", () => <NotFound />, true],
  ["deletion request form", () => <DeletionRequestForm />],
  // Staff auth.
  ["sign in", () => <AuthShell><SignInForm /></AuthShell>, true],
  ["sign up", () => <AuthShell><SignUpForm /></AuthShell>, true],
  ["reset password", () => <AuthShell><ResetFlow /></AuthShell>, true],
  ["create clinic", () => <ClinicForm />, true],
  ["accept invitation", () => <AuthShell><InviteForm invitation={invitation} signedInAs={null} /></AuthShell>, true],
  ["expired invitation", () => <AuthShell><InviteForm invitation={{ ...invitation, expired: true }} signedInAs="jess@lunhaw.test" /></AuthShell>, true],
  ["choose clinic", () => <ChooseClinic mayCreate memberships={[{ organisation: snapshot.organisation, role: "owner" }, { organisation: { ...snapshot.organisation, id: "org-2", slug: "amihan", name: "Amihan Veterinary Clinic", city: "Iligan" }, role: "vet" }]} />],
  ["forbidden", () => <Forbidden />],
  // Staff shell and day.
  ["staff shell with day view", () => <Staff><StaffShell userName="Dr. Ana Reyes"><DayView orgSlug="lunhaw" /></StaffShell></Staff>, true],
  ["day view as front desk", () => <Staff role="front_desk"><DayView orgSlug="lunhaw" /></Staff>],
  ["first run", () => <Staff data={emptySnapshot}><FirstRun orgSlug="lunhaw" clinicName="Lunhaw Animal Clinic" /></Staff>],
  // Clients and pets.
  ["clients list", () => <Staff><ClientsList orgSlug="lunhaw" /></Staff>],
  ["client detail", () => <Staff><ClientDetail orgSlug="lunhaw" id="o-long" /></Staff>],
  ["client without mobile", () => <Staff><ClientDetail orgSlug="lunhaw" id="o-nomobile" /></Staff>],
  ["new client", () => <Staff><ClientForm orgSlug="lunhaw" /></Staff>],
  ["edit client", () => <Staff><ClientForm orgSlug="lunhaw" id="o-rosa" /></Staff>],
  ["client export", () => <Staff><ClientExport orgSlug="lunhaw" id="o-rosa" /></Staff>],
  ["pets list", () => <Staff><PetsList orgSlug="lunhaw" /></Staff>],
  ["pet record", () => <Staff><PetRecord orgSlug="lunhaw" id="p-kiko" /></Staff>],
  ["pet record without birth date", () => <Staff><PetRecord orgSlug="lunhaw" id="p-ming" /></Staff>],
  ["new pet", () => <Staff><PetForm orgSlug="lunhaw" /></Staff>],
  ["edit pet", () => <Staff><PetForm orgSlug="lunhaw" id="p-kiko" /></Staff>],
  ["add visit", () => <Staff><VisitForm orgSlug="lunhaw" petId="p-bantay" /></Staff>],
  ["visit detail", () => <Staff><VisitDetail orgSlug="lunhaw" petId="p-kiko" visitId="v-1" /></Staff>],
  ["visit detail as front desk", () => <Staff role="front_desk"><VisitDetail orgSlug="lunhaw" petId="p-kiko" visitId="v-1" /></Staff>],
  // Recall.
  ["recall queue", () => <Staff><RecallQueue orgSlug="lunhaw" /></Staff>],
  ["recall queue with nothing due", () => <Staff data={emptySnapshot}><RecallQueue orgSlug="lunhaw" /></Staff>],
  ["reminder log", () => <Staff><ReminderLog orgSlug="lunhaw" /></Staff>],
  // Settings.
  ["clinic settings", () => <Staff><ClinicSettings /></Staff>],
  ["services settings", () => <Staff><ServicesSettings /></Staff>],
  ["services settings when empty", () => <Staff data={emptySnapshot}><ServicesSettings /></Staff>],
  ["staff settings", () => <Staff><StaffSettings /></Staff>],
  ["hours settings", () => <Staff><HoursSettings /></Staff>],
  ["closures settings", () => <Staff><ClosuresSettings /></Staff>],
  ["recall settings", () => <Staff><RecallSettings /></Staff>],
  ["settings refused to front desk", () => <Staff role="front_desk"><ClinicSettings /></Staff>],
  // Audit.
  ["audit trail", () => <Staff><AuditTrail orgSlug="lunhaw" /></Staff>],
  ["audit event", () => <Staff><AuditEventDetail orgSlug="lunhaw" id="e-1" /></Staff>],
  // Public booking.
  ["clinic page", () => <ClinicPage data={publicClinic} />, true],
  ["booking flow", () => <BookingFlow data={publicClinic} />, true],
  ["slot picker loading", () => <SlotPicker tz="Asia/Manila" load={() => new Promise(() => {})} value={null} onChange={() => {}} who="Any available vet" />],
  ["booking confirmation", () => <BookingConfirmation data={booking} emailedOnBooking />, true],
  ["cancelled booking", () => <BookingConfirmation data={{ ...booking, appointment: snapshot.appointments[3] }} />, true],
  // Client portal.
  ["portal sign in", () => <PortalShell signedIn={false}><PortalSignIn /></PortalShell>, true],
  ["portal appointments", () => <PortalShell signedIn><PortalAppointments data={portalData} name="Rosa Villanueva" /></PortalShell>, true],
  ["portal appointments with no name", () => <PortalShell signedIn><PortalAppointments data={portalData} name="" /></PortalShell>, true],
  ["portal appointment", () => <PortalShell signedIn><PortalAppointment data={portalData} id="a-1" /></PortalShell>, true],
  ["portal pets", () => <PortalShell signedIn><PortalPets data={portalData} /></PortalShell>, true],
  ["portal pet", () => <PortalShell signedIn><PortalPet data={portalData} id="p-kiko" /></PortalShell>, true],
];

describe("the harness itself", () => {
  it("reports violations when they exist", async () => {
    const report = await violations(
      <div>
        <button type="button" />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- deliberately broken so the gate is proven to bite */}
        <img src="/brand/icon-192.png" />
        <input type="text" />
      </div>,
    );
    expect(report).toContain("button-name");
    expect(report).toContain("image-alt");
    expect(report).toContain("label");
  });

  it("renders the screens with their data, not empty shells", () => {
    const dayView = renderToStaticMarkup(<Staff><DayView orgSlug="lunhaw" /></Staff>);
    expect(dayView).toContain("Kiko");
    expect(dayView).toContain("Maria Consolacion Villafuerte de los Santos");
    // The queue hides sent reminders by default, so only Kiko's unsent one shows. Mingming's sent ones are in the log.
    expect(renderToStaticMarkup(<Staff><RecallQueue orgSlug="lunhaw" /></Staff>)).toContain("Kiko");
    expect(renderToStaticMarkup(<Staff><ReminderLog orgSlug="lunhaw" /></Staff>)).toContain("Mingming");
    expect(renderToStaticMarkup(<ClinicPage data={publicClinic} />)).toContain("Vaccination");
    expect(renderToStaticMarkup(<Staff><AuditTrail orgSlug="lunhaw" /></Staff>)).toContain("cancelled appointment");
    expect(renderToStaticMarkup(<PortalShell signedIn><PortalAppointments data={portalData} name="Rosa Villanueva" /></PortalShell>)).toContain("Kiko");
    expect(renderToStaticMarkup(<PortalShell signedIn><PortalAppointment data={portalData} id="a-1" /></PortalShell>)).toContain("KLG-43VG");
  });
});

describe("every screen passes axe against WCAG 2 A and AA", () => {
  for (const [name, el, wholePage] of screens) {
    it(name, async () => {
      expect(await violations(el(), wholePage)).toBe("");
    });
  }

  it("covers more than forty screens", () => {
    expect(screens.length).toBeGreaterThan(40);
  });
});
