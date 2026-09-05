"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { TZDate } from "@date-fns/tz";
import { startOfDay } from "date-fns";
import { generateFixtures } from "./generate";
import type {
  Appointment,
  AppointmentStatus,
  AuditEvent,
  Fixtures,
  Member,
  Owner,
  Pet,
  Reminder,
  Role,
  Service,
  Visit,
} from "./types";

// One in-memory store for the whole prototype, so a booking made on the public
// page shows up in the staff day view. Nothing persists past a reload. The
// shape of every action is what a server action will take in the real build.

export interface StoreState extends Fixtures {
  /** The role the sandbox bar is showing. Drives navigation only. */
  role: Role;
  /** The organisation the staff shell is showing. */
  orgId: string;
  /** The member acting, for audit entries. */
  actorMemberId: string;
  /** Sandbox session start, for the time remaining display. */
  sandboxStartedAt: string;
  tourDismissed: boolean;
  fixtureHour?: number;
}

type Action =
  | { type: "role/set"; role: Role }
  | { type: "org/set"; orgId: string }
  | { type: "tour/dismiss" }
  | { type: "appointment/status"; id: string; status: AppointmentStatus; reason?: string }
  | { type: "appointment/reschedule"; id: string; startsAt: string; endsAt: string; providerId?: string }
  | { type: "appointment/create"; appointment: Omit<Appointment, "id" | "reference" | "createdAt" | "organisationId"> & { organisationId?: string } }
  | { type: "appointment/note"; id: string; note: string }
  | { type: "visit/add"; visit: Omit<Visit, "id" | "organisationId"> }
  | { type: "owner/upsert"; owner: Omit<Owner, "id" | "createdAt" | "organisationId"> & { id?: string } }
  | { type: "pet/upsert"; pet: Omit<Pet, "id" | "organisationId"> & { id?: string } }
  | { type: "service/upsert"; service: Omit<Service, "organisationId"> & { id?: string } }
  | { type: "member/invite"; member: Omit<Member, "id" | "organisationId" | "invitedAt"> }
  | { type: "member/role"; id: string; role: Role }
  | { type: "member/remove"; id: string }
  | { type: "reminder/sent"; id: string }
  | { type: "reminder/unsend"; id: string }
  | { type: "org/update"; changes: Partial<Fixtures["organisations"][number]> }
  | { type: "reset" };

let counter = 1000;
const nextId = (prefix: string) => `${prefix}_${(counter++).toString(36)}`;
const nowIso = () => new Date().toISOString();

function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KLG-";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function audit(state: StoreState, action: string, entityType: AuditEvent["entityType"], entityId: string, entityLabel: string, before?: Record<string, unknown>, after?: Record<string, unknown>): AuditEvent {
  const actor = state.members.find((m) => m.id === state.actorMemberId) ?? state.members[0];
  return {
    id: nextId("aud"),
    organisationId: state.orgId,
    actorMemberId: actor.id,
    actorName: actor.name,
    action,
    entityType,
    entityId,
    entityLabel,
    before,
    after,
    at: nowIso(),
  };
}

function label(state: StoreState, appt: Appointment): string {
  const pet = state.pets.find((p) => p.id === appt.petId);
  const svc = state.services.find((s) => s.id === appt.serviceId);
  return `${pet?.name ?? "Pet"}, ${svc?.name ?? "walk-in"}`;
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "role/set": {
      const actor = state.members.find((m) => m.organisationId === state.orgId && m.role === action.role) ?? state.members.find((m) => m.organisationId === state.orgId);
      return { ...state, role: action.role, actorMemberId: actor?.id ?? state.actorMemberId };
    }
    case "org/set": {
      const actor = state.members.find((m) => m.organisationId === action.orgId && m.role === state.role) ?? state.members.find((m) => m.organisationId === action.orgId);
      return { ...state, orgId: action.orgId, actorMemberId: actor?.id ?? state.actorMemberId, role: actor?.role ?? state.role };
    }
    case "tour/dismiss":
      return { ...state, tourDismissed: true };
    case "appointment/status": {
      const appt = state.appointments.find((a) => a.id === action.id);
      if (!appt) return state;
      const verbs: Record<AppointmentStatus, string> = {
        booked: "Reopened appointment",
        confirmed: "Confirmed appointment",
        arrived: "Marked arrived",
        completed: "Marked completed",
        cancelled: "Cancelled appointment",
        no_show: "Marked no-show",
      };
      const updated: Appointment = { ...appt, status: action.status, cancelReason: action.status === "cancelled" ? action.reason : appt.cancelReason };
      return {
        ...state,
        appointments: state.appointments.map((a) => (a.id === appt.id ? updated : a)),
        audit: [audit(state, verbs[action.status], "appointment", appt.id, label(state, appt), { status: appt.status }, { status: action.status, ...(action.reason ? { reason: action.reason } : {}) }), ...state.audit],
      };
    }
    case "appointment/reschedule": {
      const appt = state.appointments.find((a) => a.id === action.id);
      if (!appt) return state;
      const updated: Appointment = { ...appt, startsAt: action.startsAt, endsAt: action.endsAt, providerId: action.providerId ?? appt.providerId, status: appt.status === "cancelled" ? "booked" : appt.status };
      return {
        ...state,
        appointments: state.appointments.map((a) => (a.id === appt.id ? updated : a)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        audit: [audit(state, "Rescheduled appointment", "appointment", appt.id, label(state, appt), { startsAt: appt.startsAt }, { startsAt: action.startsAt }), ...state.audit],
      };
    }
    case "appointment/create": {
      const appt: Appointment = {
        ...action.appointment,
        id: nextId("apt"),
        organisationId: action.appointment.organisationId ?? state.orgId,
        reference: makeReference(),
        createdAt: nowIso(),
      };
      const verb = appt.source === "walk_in" ? "Added walk-in" : appt.source === "online" ? "Booked online" : "Booked at the desk";
      return {
        ...state,
        appointments: [...state.appointments, appt].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        audit: [audit({ ...state, orgId: appt.organisationId }, verb, "appointment", appt.id, label(state, appt), undefined, { status: appt.status, startsAt: appt.startsAt }), ...state.audit],
      };
    }
    case "appointment/note": {
      return { ...state, appointments: state.appointments.map((a) => (a.id === action.id ? { ...a, note: action.note } : a)) };
    }
    case "visit/add": {
      const visit: Visit = { ...action.visit, id: nextId("vis"), organisationId: state.orgId };
      const appt = state.appointments.find((a) => a.id === visit.appointmentId);
      const svc = appt ? state.services.find((s) => s.id === appt.serviceId) : undefined;
      const day = visit.at.slice(0, 10);
      const pets = state.pets.map((p) => {
        if (p.id !== visit.petId) return p;
        return {
          ...p,
          weightKg: visit.weightKg ?? p.weightKg,
          lastVaccination: svc?.recallKind === "vaccination" ? day : p.lastVaccination,
          lastDeworming: svc?.recallKind === "deworming" ? day : p.lastDeworming,
          lastGroom: svc?.recallKind === "grooming" ? day : p.lastGroom,
        };
      });
      const appointments = state.appointments.map((a) => (a.id === visit.appointmentId ? { ...a, status: "completed" as const } : a));
      const pet = state.pets.find((p) => p.id === visit.petId);
      return {
        ...state,
        visits: [...state.visits, visit],
        pets,
        appointments,
        audit: [audit(state, "Added visit", "visit", visit.id, `${pet?.name ?? "Pet"}, ${svc?.name ?? "visit"}`, undefined, { weightKg: visit.weightKg, administered: visit.administered }), ...state.audit],
      };
    }
    case "owner/upsert": {
      const existing = action.owner.id ? state.owners.find((o) => o.id === action.owner.id) : undefined;
      const owner: Owner = existing
        ? { ...existing, ...action.owner, id: existing.id }
        : { ...action.owner, id: nextId("own"), organisationId: state.orgId, createdAt: nowIso() };
      return {
        ...state,
        owners: existing ? state.owners.map((o) => (o.id === owner.id ? owner : o)) : [...state.owners, owner],
        audit: [audit(state, existing ? "Edited client" : "Added client", "owner", owner.id, owner.name, existing ? { name: existing.name, mobile: existing.mobile } : undefined, { name: owner.name, mobile: owner.mobile }), ...state.audit],
      };
    }
    case "pet/upsert": {
      const existing = action.pet.id ? state.pets.find((p) => p.id === action.pet.id) : undefined;
      const pet: Pet = existing ? { ...existing, ...action.pet, id: existing.id } : { ...action.pet, id: nextId("pet"), organisationId: state.orgId };
      return {
        ...state,
        pets: existing ? state.pets.map((p) => (p.id === pet.id ? pet : p)) : [...state.pets, pet],
        audit: [audit(state, existing ? "Edited pet" : "Added pet", "pet", pet.id, pet.name, existing ? { name: existing.name, breed: existing.breed } : undefined, { name: pet.name, breed: pet.breed }), ...state.audit],
      };
    }
    case "service/upsert": {
      const existing = action.service.id ? state.services.find((s) => s.id === action.service.id) : undefined;
      const service: Service = existing ? { ...existing, ...action.service, id: existing.id } : { ...action.service, id: nextId("svc"), organisationId: state.orgId };
      return {
        ...state,
        services: existing ? state.services.map((s) => (s.id === service.id ? service : s)) : [...state.services, service],
        audit: [audit(state, existing ? "Edited service" : "Added service", "service", service.id, service.name, existing ? { pricePhp: existing.pricePhp, durationMin: existing.durationMin } : undefined, { pricePhp: service.pricePhp, durationMin: service.durationMin }), ...state.audit],
      };
    }
    case "member/invite": {
      const member: Member = { ...action.member, id: nextId("mem"), organisationId: state.orgId, invitedAt: nowIso() };
      return { ...state, members: [...state.members, member], audit: [audit(state, "Invited member", "member", member.id, `${member.name}, ${member.role}`), ...state.audit] };
    }
    case "member/role": {
      const m = state.members.find((x) => x.id === action.id);
      if (!m) return state;
      return {
        ...state,
        members: state.members.map((x) => (x.id === m.id ? { ...x, role: action.role } : x)),
        audit: [audit(state, "Changed role", "member", m.id, m.name, { role: m.role }, { role: action.role }), ...state.audit],
      };
    }
    case "member/remove": {
      const m = state.members.find((x) => x.id === action.id);
      if (!m) return state;
      return { ...state, members: state.members.filter((x) => x.id !== m.id), audit: [audit(state, "Removed member", "member", m.id, m.name, { role: m.role }), ...state.audit] };
    }
    case "reminder/sent":
    case "reminder/unsend": {
      const r = state.reminders.find((x) => x.id === action.id);
      if (!r) return state;
      const sent = action.type === "reminder/sent";
      const updated: Reminder = { ...r, sentAt: sent ? nowIso() : undefined, sentByMemberId: sent ? state.actorMemberId : undefined };
      const pet = state.pets.find((p) => p.id === r.petId);
      return {
        ...state,
        reminders: state.reminders.map((x) => (x.id === r.id ? updated : x)),
        audit: [audit(state, sent ? "Marked reminder sent" : "Unmarked reminder", "reminder", r.id, `${pet?.name ?? "Pet"}, ${r.kind}`), ...state.audit],
      };
    }
    case "org/update": {
      const org = state.organisations.find((o) => o.id === state.orgId);
      if (!org) return state;
      return {
        ...state,
        organisations: state.organisations.map((o) => (o.id === org.id ? { ...o, ...action.changes } : o)),
        audit: [audit(state, "Updated clinic settings", "organisation", org.id, org.name, undefined, action.changes as Record<string, unknown>), ...state.audit],
      };
    }
    case "reset":
      return initialState(state.fixtureHour);
    default:
      return state;
  }
}

function initialState(fixtureHour?: number): StoreState {
  const fixtures = generateFixtures(startOfDay(TZDate.tz("Asia/Manila")), fixtureHour);
  return {
    ...fixtures,
    role: "owner",
    orgId: "org_lunhaw",
    actorMemberId: "mem_ana",
    sandboxStartedAt: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    tourDismissed: false,
    fixtureHour,
  };
}

const StoreContext = createContext<{ state: StoreState; dispatch: (a: Action) => void } | null>(null);

/**
 * fixtureHour is the clinic's current hour, read once on the server and passed
 * down, so the server render and hydration build the same fixtures.
 */
export function MockStoreProvider({ children, fixtureHour }: { children: ReactNode; fixtureHour?: number }) {
  const [state, dispatch] = useReducer(reducer, fixtureHour, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside MockStoreProvider");
  return ctx;
}

/** Everything scoped to the organisation the shell is showing. */
export function useOrg(orgSlugOrId?: string) {
  const { state, dispatch } = useStore();
  const org = state.organisations.find((o) => o.id === (orgSlugOrId ?? state.orgId) || o.slug === orgSlugOrId) ?? state.organisations[0];
  const scoped = useMemo(() => {
    const id = org.id;
    return {
      org,
      members: state.members.filter((m) => m.organisationId === id),
      services: state.services.filter((s) => s.organisationId === id),
      providers: state.providers.filter((p) => p.organisationId === id),
      owners: state.owners.filter((o) => o.organisationId === id),
      pets: state.pets.filter((p) => p.organisationId === id),
      appointments: state.appointments.filter((a) => a.organisationId === id),
      visits: state.visits.filter((v) => v.organisationId === id),
      reminders: state.reminders.filter((r) => r.organisationId === id),
      audit: state.audit.filter((a) => a.organisationId === id),
    };
  }, [org, state]);
  return { ...scoped, role: state.role, actorMemberId: state.actorMemberId, state, dispatch };
}

export type { Action as StoreAction };
