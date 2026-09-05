import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import type {
  Appointment,
  AppointmentStatus,
  AuditEvent,
  Fixtures,
  Member,
  Organisation,
  Owner,
  Pet,
  Provider,
  RecallKind,
  Reminder,
  Service,
  Visit,
} from "./types";
import { renderReminder } from "@/content/templates";

// Fixtures are generated relative to the clinic's current day so the demo never
// looks abandoned. Everything is deterministic for a given anchor day, which
// keeps server and client renders identical. "Now" inside the fixture day is a
// fixed clinic hour, FIXTURE_HOUR, rather than the live clock, so a status
// never flips between the server render and hydration.

export const FIXTURE_HOUR = 11;
const TZ = "Asia/Manila";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ids restart for every generateFixtures call. A module level counter would
// keep climbing across server requests while the client starts fresh, and the
// two renders would disagree.
let idCounter = 100;
const ids = (prefix: string) => `${prefix}_${(idCounter++).toString(36)}`;

function reference(rand: () => number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KLG-";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(rand() * alphabet.length)];
  return out;
}

const iso = (d: Date) => d.toISOString();
const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export const organisations: Organisation[] = [
  {
    id: "org_lunhaw",
    slug: "lunhaw",
    name: "Lunhaw Animal Clinic",
    city: "Cagayan de Oro",
    address: "Door 3, Velez corner Capistrano, Cagayan de Oro City",
    mobile: "0917 555 0142",
    email: "hello@lunhaw.example",
    timezone: TZ,
    openFrom: "09:00",
    openTo: "18:00",
    groomingIntervalWeeks: 5,
  },
  {
    id: "org_amihan",
    slug: "amihan",
    name: "Amihan Veterinary Clinic",
    city: "Iligan",
    address: "Roxas Avenue, Iligan City",
    mobile: "0918 555 0199",
    email: "hello@amihan.example",
    timezone: TZ,
    openFrom: "09:00",
    openTo: "17:00",
    groomingIntervalWeeks: 6,
  },
];

const allDays = [0, 1, 2, 3, 4, 5, 6];
const hours = (days: number[], from = "09:00", to = "18:00") => days.map((day) => ({ day, from, to }));

export const providers: Provider[] = [
  {
    id: "prov_ana",
    organisationId: "org_lunhaw",
    name: "Dr. Ana Reyes",
    title: "Vet",
    weeklyHours: hours([1, 2, 3, 4, 5, 6]),
    exceptions: [],
  },
  {
    id: "prov_paolo",
    organisationId: "org_lunhaw",
    name: "Dr. Paolo Dimaculangan",
    title: "Vet",
    weeklyHours: hours([0, 2, 3, 4, 5, 6]),
    exceptions: [],
  },
  {
    id: "prov_jess",
    organisationId: "org_lunhaw",
    name: "Jess Tan",
    title: "Groomer",
    weeklyHours: hours(allDays, "09:00", "17:00"),
    exceptions: [],
  },
  {
    id: "prov_ana_amihan",
    organisationId: "org_amihan",
    name: "Dr. Ana Reyes",
    title: "Vet",
    weeklyHours: hours([1, 3, 5], "09:00", "17:00"),
    exceptions: [],
  },
];

export const members: Member[] = [
  {
    id: "mem_ana",
    organisationId: "org_lunhaw",
    name: "Dr. Ana Reyes",
    email: "ana@lunhaw.example",
    role: "owner",
    providerId: "prov_ana",
    invitedAt: "2026-06-01T01:00:00.000Z",
  },
  {
    id: "mem_paolo",
    organisationId: "org_lunhaw",
    name: "Dr. Paolo Dimaculangan",
    email: "paolo@lunhaw.example",
    role: "vet",
    providerId: "prov_paolo",
    invitedAt: "2026-06-03T01:00:00.000Z",
  },
  {
    id: "mem_maria",
    organisationId: "org_lunhaw",
    name: "Maria Santos",
    email: "maria@lunhaw.example",
    role: "front_desk",
    invitedAt: "2026-06-03T02:00:00.000Z",
  },
  {
    id: "mem_ana_amihan",
    organisationId: "org_amihan",
    name: "Dr. Ana Reyes",
    email: "ana@lunhaw.example",
    role: "vet",
    providerId: "prov_ana_amihan",
    invitedAt: "2026-07-10T01:00:00.000Z",
  },
  {
    id: "mem_rowena",
    organisationId: "org_amihan",
    name: "Rowena Tabora",
    email: "rowena@amihan.example",
    role: "owner",
    invitedAt: "2026-07-01T01:00:00.000Z",
  },
];

export const services: Service[] = [
  { id: "svc_consult", organisationId: "org_lunhaw", name: "Consultation", durationMin: 30, bufferMin: 0, pricePhp: 500, publiclyBookable: true },
  { id: "svc_vacc", organisationId: "org_lunhaw", name: "Vaccination", durationMin: 20, bufferMin: 10, pricePhp: 850, publiclyBookable: true, recallKind: "vaccination" },
  { id: "svc_deworm", organisationId: "org_lunhaw", name: "Deworming", durationMin: 15, bufferMin: 0, pricePhp: 350, publiclyBookable: true, recallKind: "deworming" },
  { id: "svc_groom", organisationId: "org_lunhaw", name: "Grooming", durationMin: 60, bufferMin: 15, pricePhp: 600, publiclyBookable: true, recallKind: "grooming" },
  { id: "svc_dental", organisationId: "org_lunhaw", name: "Dental scaling", durationMin: 45, bufferMin: 15, pricePhp: 1500, publiclyBookable: false },
  { id: "svc_consult_am", organisationId: "org_amihan", name: "Consultation", durationMin: 30, bufferMin: 0, pricePhp: 450, publiclyBookable: true },
  { id: "svc_vacc_am", organisationId: "org_amihan", name: "Vaccination", durationMin: 20, bufferMin: 10, pricePhp: 800, publiclyBookable: true, recallKind: "vaccination" },
];

interface OwnerSeed {
  name: string;
  mobile?: string;
  email?: string;
  pets: { name: string; species: "dog" | "cat"; breed: string; sex: "male" | "female"; ageYears: number }[];
}

// Invented people and animals. The long first name wraps to two lines on a
// phone, which is the point. One owner has no mobile number on file.
const lunhawSeeds: OwnerSeed[] = [
  { name: "Maria Kristina Angelica de los Santos Villanueva", mobile: "0917 555 0101", email: "mkav@example.com", pets: [{ name: "Kiko", species: "dog", breed: "Aspin", sex: "male", ageYears: 3 }] },
  { name: "Jonel Abellanosa", mobile: "0918 555 0102", pets: [{ name: "Mingming", species: "cat", breed: "Puspin", sex: "female", ageYears: 2 }, { name: "Bantay", species: "dog", breed: "Aspin", sex: "male", ageYears: 6 }] },
  { name: "Grace Uy", mobile: "0919 555 0103", email: "grace.uy@example.com", pets: [{ name: "Choco", species: "dog", breed: "Shih Tzu", sex: "male", ageYears: 4 }] },
  { name: "Ramon Bautista", pets: [{ name: "Muning", species: "cat", breed: "Puspin", sex: "female", ageYears: 5 }] },
  { name: "Kathleen Mabini", mobile: "0920 555 0105", email: "kath.mabini@example.com", pets: [{ name: "Princess", species: "dog", breed: "Pomeranian", sex: "female", ageYears: 1 }] },
  { name: "Dodong Salazar", mobile: "0921 555 0106", pets: [{ name: "Bogart", species: "dog", breed: "Aspin", sex: "male", ageYears: 8 }] },
  { name: "Aileen Pacana", mobile: "0922 555 0107", email: "aileen.p@example.com", pets: [{ name: "Whitey", species: "cat", breed: "Persian", sex: "male", ageYears: 3 }, { name: "Tisay", species: "cat", breed: "Puspin", sex: "female", ageYears: 1 }] },
  { name: "Bernard Lim", mobile: "0923 555 0108", pets: [{ name: "Blackie", species: "dog", breed: "Labrador", sex: "male", ageYears: 5 }] },
  { name: "Cristina Ybañez", mobile: "0924 555 0109", email: "cris.ybanez@example.com", pets: [{ name: "Luna", species: "dog", breed: "Beagle", sex: "female", ageYears: 2 }] },
  { name: "Noel Dagondon", mobile: "0925 555 0110", pets: [{ name: "Simba", species: "cat", breed: "Puspin", sex: "male", ageYears: 4 }] },
  { name: "Faith Villarin", mobile: "0926 555 0111", email: "faith.v@example.com", pets: [{ name: "Coco", species: "dog", breed: "Poodle", sex: "female", ageYears: 7 }] },
  { name: "Jun Pelaez", mobile: "0927 555 0112", pets: [{ name: "Pepper", species: "dog", breed: "Dachshund", sex: "male", ageYears: 3 }] },
  { name: "Liza Neri", mobile: "0928 555 0113", email: "liza.neri@example.com", pets: [{ name: "Max", species: "dog", breed: "Golden Retriever", sex: "male", ageYears: 2 }] },
  { name: "Marvin Ocampo", mobile: "0929 555 0114", pets: [{ name: "Toto", species: "cat", breed: "Puspin", sex: "male", ageYears: 9 }] },
  { name: "Che Gonzaga", mobile: "0930 555 0115", email: "che.gonzaga@example.com", pets: [{ name: "Sasha", species: "dog", breed: "Aspin", sex: "female", ageYears: 1 }] },
  { name: "Ericka Tumulak", mobile: "0931 555 0116", pets: [{ name: "Oreo", species: "cat", breed: "Puspin", sex: "male", ageYears: 2 }] },
];

const amihanSeeds: OwnerSeed[] = [
  { name: "Paz Macaraeg", mobile: "0932 555 0201", pets: [{ name: "Brownie", species: "dog", breed: "Aspin", sex: "male", ageYears: 4 }] },
  { name: "Ivan Cabahug", mobile: "0933 555 0202", pets: [{ name: "Mimi", species: "cat", breed: "Puspin", sex: "female", ageYears: 3 }] },
  { name: "Sheila Dumanjug", mobile: "0934 555 0203", pets: [{ name: "Rocky", species: "dog", breed: "Aspin", sex: "male", ageYears: 6 }] },
];

const visitNotes = [
  "Bright and alert. Coat in good condition. Owner reports normal appetite.",
  "Mild tartar on upper molars. Advised dental scaling within six months.",
  "Slight weight gain since last visit. Discussed portion sizes.",
  "Ear check clear. No signs of mites.",
  "Nail trim done alongside the main service. Calm throughout.",
  "Owner asked about tick prevention. Started monthly spot-on.",
];

const cancelReasons = ["Owner rescheduled by phone", "Pet unwell, owner asked to wait", "Owner travelling", "Booked twice by mistake"];

function timeOn(day: TZDate, hh: number, mm: number): TZDate {
  return setMinutes(setHours(startOfDay(day), hh), mm) as TZDate;
}

function statusFor(rand: () => number, start: TZDate, fixtureNow: TZDate): AppointmentStatus {
  if (isBefore(start, fixtureNow)) {
    const r = rand();
    if (r < 0.08) return "no_show";
    if (r < 0.18) return "cancelled";
    return "completed";
  }
  const r = rand();
  if (r < 0.1) return "cancelled";
  return r < 0.6 ? "confirmed" : "booked";
}

/**
 * Build every fixture relative to the anchor day. Appointments run two weeks
 * back and three weeks forward. Today is the heavy day: sixteen appointments,
 * two cancelled, one no-show, the wrapping name, the owner with no mobile, and
 * a walk-in with no service.
 */
export function generateFixtures(anchorDay: Date = startOfDay(TZDate.tz(TZ))): Fixtures {
  idCounter = 100;
  const anchor = new TZDate(anchorDay, TZ);
  const rand = mulberry32(Number(format(anchor, "yyyyMMdd")));
  const fixtureNow = timeOn(anchor, FIXTURE_HOUR, 0);

  const owners: Owner[] = [];
  const pets: Pet[] = [];
  const seedOwners = (orgId: string, seeds: OwnerSeed[]) => {
    for (const s of seeds) {
      const owner: Owner = {
        id: ids("own"),
        organisationId: orgId,
        name: s.name,
        mobile: s.mobile,
        email: s.email,
        createdAt: iso(subMonths(anchor, 3 + Math.floor(rand() * 9))),
      };
      owners.push(owner);
      for (const p of s.pets) {
        pets.push({
          id: ids("pet"),
          organisationId: orgId,
          ownerId: owner.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          sex: p.sex,
          birthDate: dateKey(subMonths(subDays(anchor, Math.floor(rand() * 300)), p.ageYears * 12)),
          weightKg: Math.round((p.species === "cat" ? 3 + rand() * 3 : 6 + rand() * 20) * 10) / 10,
        });
      }
    }
  };
  seedOwners("org_lunhaw", lunhawSeeds);
  seedOwners("org_amihan", amihanSeeds);

  const appointments: Appointment[] = [];
  const visits: Visit[] = [];
  const audit: AuditEvent[] = [];
  const actorFor = (orgId: string) => members.find((m) => m.organisationId === orgId && m.role === "front_desk") ?? members.find((m) => m.organisationId === orgId)!;

  const log = (orgId: string, actor: Member, action: string, entity: AuditEvent["entityType"], entityId: string, entityLabel: string, at: Date, before?: Record<string, unknown>, after?: Record<string, unknown>) => {
    audit.push({ id: ids("aud"), organisationId: orgId, actorMemberId: actor.id, actorName: actor.name, action, entityType: entity, entityId, entityLabel, before, after, at: iso(at) });
  };

  const generateOrg = (org: Organisation, heavy: boolean) => {
    const orgProviders = providers.filter((p) => p.organisationId === org.id);
    const orgServices = services.filter((s) => s.organisationId === org.id && s.publiclyBookable);
    const orgPets = pets.filter((p) => p.organisationId === org.id);
    const actor = actorFor(org.id);
    const [openH] = org.openFrom.split(":").map(Number);
    const [closeH] = org.openTo.split(":").map(Number);

    for (let offset = -14; offset <= 21; offset++) {
      const day = addDays(anchor, offset) as TZDate;
      const isToday = offset === 0;
      const count = heavy && isToday ? 16 : heavy ? 4 + Math.floor(rand() * 6) : 1 + Math.floor(rand() * 3);
      const used = new Set<string>();

      for (let i = 0; i < count; i++) {
        const provider = orgProviders[i % orgProviders.length];
        const service = orgServices[Math.floor(rand() * orgServices.length)];
        const totalSlots = ((closeH - openH) * 60) / 15 - Math.ceil(service.durationMin / 15);
        let slot = Math.floor(rand() * totalSlots);
        let guard = 0;
        while (used.has(`${provider.id}:${slot}`) && guard++ < 40) slot = (slot + 3) % totalSlots;
        used.add(`${provider.id}:${slot}`);
        const start = addMinutes(timeOn(day, openH, 0), slot * 15) as TZDate;
        const end = addMinutes(start, service.durationMin) as TZDate;
        const pet = orgPets[Math.floor(rand() * orgPets.length)];
        const status = statusFor(rand, start, fixtureNow);
        const appt: Appointment = {
          id: ids("apt"),
          organisationId: org.id,
          reference: reference(rand),
          ownerId: pet.ownerId,
          petId: pet.id,
          serviceId: service.id,
          providerId: provider.id,
          startsAt: iso(start),
          endsAt: iso(end),
          status,
          source: rand() < 0.55 ? "online" : "staff",
          createdAt: iso(subDays(start, 2 + Math.floor(rand() * 10))),
        };
        if (status === "cancelled") appt.cancelReason = cancelReasons[Math.floor(rand() * cancelReasons.length)];
        appointments.push(appt);
        log(org.id, actor, appt.source === "online" ? "Booked online" : "Booked at the desk", "appointment", appt.id, `${pet.name}, ${service.name}`, new Date(appt.createdAt), undefined, { status: "booked", startsAt: appt.startsAt });
        if (status === "cancelled") log(org.id, actor, "Cancelled appointment", "appointment", appt.id, `${pet.name}, ${service.name}`, subDays(start, 1), { status: "confirmed" }, { status: "cancelled", reason: appt.cancelReason });
        if (status === "no_show") log(org.id, actor, "Marked no-show", "appointment", appt.id, `${pet.name}, ${service.name}`, addMinutes(start, 20), { status: "confirmed" }, { status: "no_show" });
        if (status === "completed") {
          const vet = members.find((m) => m.providerId === provider.id) ?? actor;
          const visit: Visit = {
            id: ids("vis"),
            organisationId: org.id,
            appointmentId: appt.id,
            petId: pet.id,
            providerId: provider.id,
            at: iso(end),
            weightKg: pet.weightKg,
            notes: visitNotes[Math.floor(rand() * visitNotes.length)],
            administered: service.recallKind === "vaccination" ? ["5-in-1 vaccine"] : service.recallKind === "deworming" ? ["Broad spectrum dewormer"] : service.recallKind === "grooming" ? ["Full groom", "Nail trim"] : [],
            paymentMethod: rand() < 0.5 ? "gcash" : "cash",
            paymentRef: rand() < 0.5 ? `GC${Math.floor(1000000 + rand() * 8999999)}` : undefined,
          };
          visits.push(visit);
          log(org.id, vet, "Added visit", "visit", visit.id, `${pet.name}, ${service.name}`, end, undefined, { weightKg: visit.weightKg, administered: visit.administered });
        }
      }

      if (heavy && isToday) {
        // The stress cases the design has to survive.
        const longName = owners.find((o) => o.name.startsWith("Maria Kristina"))!;
        const longPet = pets.find((p) => p.ownerId === longName.id)!;
        const noMobile = owners.find((o) => !o.mobile && o.organisationId === org.id)!;
        const noMobilePet = pets.find((p) => p.ownerId === noMobile.id)!;
        const groomer = orgProviders.find((p) => p.title === "Groomer") ?? orgProviders[0];
        const vaccination = orgServices.find((s) => s.recallKind === "vaccination")!;
        const consult = orgServices.find((s) => s.name === "Consultation")!;
        const forced: Array<Partial<Appointment> & { hh: number; mm: number; durationMin: number }> = [
          { hh: 14, mm: 30, durationMin: 20, ownerId: longName.id, petId: longPet.id, serviceId: vaccination.id, providerId: orgProviders[0].id, status: "confirmed", source: "online" },
          { hh: 15, mm: 0, durationMin: 30, ownerId: noMobile.id, petId: noMobilePet.id, serviceId: consult.id, providerId: orgProviders[1]?.id ?? orgProviders[0].id, status: "booked", source: "staff" },
          { hh: 10, mm: 45, durationMin: 30, ownerId: noMobile.id, petId: noMobilePet.id, serviceId: null, providerId: groomer.id, status: "arrived", source: "walk_in", note: "Walked in, service not chosen yet" },
        ];
        for (const f of forced) {
          const start = timeOn(day, f.hh, f.mm);
          const pet = pets.find((p) => p.id === f.petId)!;
          appointments.push({
            id: ids("apt"),
            organisationId: org.id,
            reference: reference(rand),
            ownerId: f.ownerId!,
            petId: f.petId!,
            serviceId: f.serviceId ?? null,
            providerId: f.providerId!,
            startsAt: iso(start),
            endsAt: iso(addMinutes(start, f.durationMin)),
            status: f.status!,
            source: f.source!,
            note: f.note,
            createdAt: iso(subDays(start, 3)),
          });
          log(org.id, actor, f.source === "walk_in" ? "Added walk-in" : "Booked", "appointment", appointments[appointments.length - 1].id, `${pet.name}`, subDays(start, 3));
        }
        // Guarantee the counts the design doc names: two cancelled, one no-show.
        const todays = appointments.filter((a) => a.organisationId === org.id && dateKey(new TZDate(new Date(a.startsAt), TZ)) === dateKey(anchor));
        const pastToday = todays.filter((a) => isBefore(new Date(a.startsAt), fixtureNow) && a.status === "completed");
        const futureToday = todays.filter((a) => !isBefore(new Date(a.startsAt), fixtureNow) && (a.status === "booked" || a.status === "confirmed"));
        if (!todays.some((a) => a.status === "no_show") && pastToday[0]) pastToday[0].status = "no_show";
        const cancelledCount = todays.filter((a) => a.status === "cancelled").length;
        for (let i = cancelledCount; i < 2 && futureToday[i]; i++) {
          futureToday[i].status = "cancelled";
          futureToday[i].cancelReason = cancelReasons[i];
        }
        // One arrived and waiting right now, so the active state shows.
        const next = futureToday.find((a) => a.status === "confirmed");
        if (next) next.status = "arrived";
      }
    }
  };

  generateOrg(organisations[0], true);
  generateOrg(organisations[1], false);

  // Recall dates come from the most recent visit of each kind, then get spread
  // so the queue has items due this week, next week and overdue.
  for (const pet of pets) {
    const petVisits = visits.filter((v) => v.petId === pet.id).sort((a, b) => a.at.localeCompare(b.at));
    for (const v of petVisits) {
      const appt = appointments.find((a) => a.id === v.appointmentId)!;
      const svc = services.find((s) => s.id === appt.serviceId);
      if (svc?.recallKind === "vaccination") pet.lastVaccination = dateKey(new TZDate(new Date(v.at), TZ));
      if (svc?.recallKind === "deworming") pet.lastDeworming = dateKey(new TZDate(new Date(v.at), TZ));
      if (svc?.recallKind === "grooming") pet.lastGroom = dateKey(new TZDate(new Date(v.at), TZ));
    }
    // Backfill older history so recall has something to say for every animal.
    const spread = Math.floor(rand() * 20) - 4; // days from now that the next vaccination lands on
    if (!pet.lastVaccination) pet.lastVaccination = dateKey(subYears1(addDays(anchor, spread)));
    if (!pet.lastDeworming) pet.lastDeworming = dateKey(subMonths(addDays(anchor, Math.floor(rand() * 14) - 3), 3));
    if (pet.species === "dog" && !pet.lastGroom && rand() < 0.7) pet.lastGroom = dateKey(subWeeks(addDays(anchor, Math.floor(rand() * 10) - 2), 5));
  }

  const reminders: Reminder[] = [];
  for (const pet of pets) {
    const org = organisations.find((o) => o.id === pet.organisationId)!;
    const owner = owners.find((o) => o.id === pet.ownerId)!;
    const due: Array<[RecallKind, Date | undefined]> = [
      ["vaccination", pet.lastVaccination ? addYears(new TZDate(pet.lastVaccination, TZ), 1) : undefined],
      ["deworming", pet.lastDeworming ? addMonths(new TZDate(pet.lastDeworming, TZ), 3) : undefined],
      ["grooming", pet.lastGroom ? addWeeks(new TZDate(pet.lastGroom, TZ), org.groomingIntervalWeeks) : undefined],
    ];
    for (const [kind, on] of due) {
      if (!on) continue;
      const days = differenceInCalendarDays(on, anchor);
      if (days < -21 || days > 14) continue;
      const dueOn = dateKey(on);
      const generatedAt = iso(subDays(anchor, 1));
      const sent = days < 0 && rand() < 0.5;
      reminders.push({
        id: ids("rem"),
        organisationId: org.id,
        petId: pet.id,
        kind,
        dueOn,
        message: renderReminder(kind, { petName: pet.name, ownerName: owner.name.split(" ")[0], clinicName: org.name, dueOn, bookingUrl: `kalinga.cjjutba.dev/${org.slug}` }),
        generatedAt,
        sentAt: sent ? iso(subDays(anchor, 1)) : undefined,
        sentByMemberId: sent ? actorFor(org.id).id : undefined,
      });
    }
  }

  // A few non appointment audit events so the trail shows every entity type.
  const ana = members[0];
  log("org_lunhaw", ana, "Invited member", "member", "mem_maria", "Maria Santos, front desk", subMonths(anchor, 3));
  log("org_lunhaw", ana, "Changed service price", "service", "svc_groom", "Grooming", subWeeks(anchor, 2), { pricePhp: 550 }, { pricePhp: 600 });
  log("org_lunhaw", ana, "Updated working hours", "provider", "prov_paolo", "Dr. Paolo Dimaculangan", subWeeks(anchor, 1), { days: "Tue to Sat" }, { days: "Sun, Tue to Sat" });
  log("org_lunhaw", actorFor("org_lunhaw"), "Marked reminder sent", "reminder", reminders[0]?.id ?? "rem_none", reminders[0] ? `${pets.find((p) => p.id === reminders[0].petId)?.name}, ${reminders[0].kind}` : "Reminder", subDays(anchor, 1));

  audit.sort((a, b) => b.at.localeCompare(a.at));
  appointments.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return { organisations, members, services, providers, owners, pets, appointments, visits, reminders, audit };
}

function subYears1(d: Date): Date {
  return addYears(d, -1);
}
