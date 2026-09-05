import { relations, sql } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { member, organization, user } from "./auth-schema";

// The schema. Better Auth owns user, session, account, verification,
// organization, member and invitation, generated into auth-schema.ts. The
// organisation row is the tenant. Every table below carries organisation_id
// pointing at it, with no exceptions and no "this one is only settings".
// Every timestamp is timestamptz in UTC. Availability is stored as weekly
// rules plus exceptions on the provider, never as materialised slots.

export * from "./auth-schema";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const organisationId = () =>
  text("organisation_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const providerTitle = pgEnum("provider_title", ["Vet", "Groomer"]);
export const species = pgEnum("species", ["dog", "cat"]);
export const sex = pgEnum("sex", ["male", "female"]);
export const appointmentStatus = pgEnum("appointment_status", ["booked", "confirmed", "arrived", "completed", "cancelled", "no_show"]);
export const appointmentSource = pgEnum("appointment_source", ["online", "staff", "walk_in"]);
export const recallKind = pgEnum("recall_kind", ["vaccination", "deworming", "grooming"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "gcash"]);
export const auditEntity = pgEnum("audit_entity", ["appointment", "pet", "owner", "visit", "member", "service", "provider", "reminder", "organisation"]);

export interface WeeklyRule {
  /** 0 is Sunday. */
  day: number;
  from: string;
  to: string;
}

export interface ProviderException {
  /** ISO date in clinic local time. */
  date: string;
  reason: string;
}

export const service = pgTable(
  "service",
  {
    id: id(),
    organisationId: organisationId(),
    name: text("name").notNull(),
    durationMin: integer("duration_min").notNull(),
    bufferMin: integer("buffer_min").notNull().default(0),
    pricePhp: integer("price_php").notNull().default(0),
    publiclyBookable: boolean("publicly_bookable").notNull().default(true),
    recallKind: recallKind("recall_kind"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("service_org_idx").on(t.organisationId)],
);

export const provider = pgTable(
  "provider",
  {
    id: id(),
    organisationId: organisationId(),
    name: text("name").notNull(),
    title: providerTitle("title").notNull(),
    /** Set when the provider is also a member who signs in. */
    memberId: text("member_id").references(() => member.id, { onDelete: "set null" }),
    weeklyHours: jsonb("weekly_hours").$type<WeeklyRule[]>().notNull().default([]),
    exceptions: jsonb("exceptions").$type<ProviderException[]>().notNull().default([]),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("provider_org_idx").on(t.organisationId)],
);

export const owner = pgTable(
  "owner",
  {
    id: id(),
    organisationId: organisationId(),
    name: text("name").notNull(),
    mobile: text("mobile"),
    email: text("email"),
    notes: text("notes"),
    /** Set once the owner has signed in to the portal with a magic link. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("owner_org_idx").on(t.organisationId), index("owner_org_email_idx").on(t.organisationId, t.email), index("owner_org_mobile_idx").on(t.organisationId, t.mobile)],
);

export const pet = pgTable(
  "pet",
  {
    id: id(),
    organisationId: organisationId(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owner.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    species: species("species").notNull(),
    breed: text("breed").notNull(),
    sex: sex("sex").notNull(),
    birthDate: date("birth_date"),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    lastVaccination: date("last_vaccination"),
    lastDeworming: date("last_deworming"),
    lastGroom: date("last_groom"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("pet_org_idx").on(t.organisationId), index("pet_owner_idx").on(t.ownerId)],
);

export const appointment = pgTable(
  "appointment",
  {
    id: id(),
    organisationId: organisationId(),
    /** Short reference the pet owner keeps, e.g. KLG-4F7Q. Unique within the organisation. */
    reference: text("reference").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owner.id, { onDelete: "cascade" }),
    petId: text("pet_id")
      .notNull()
      .references(() => pet.id, { onDelete: "cascade" }),
    /** Null for a walk-in that has not picked a service. */
    serviceId: text("service_id").references(() => service.id, { onDelete: "set null" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => provider.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatus("status").notNull().default("booked"),
    source: appointmentSource("source").notNull(),
    note: text("note"),
    cancelReason: text("cancel_reason"),
    createdByMemberId: text("created_by_member_id").references(() => member.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("appointment_org_reference_idx").on(t.organisationId, t.reference),
    index("appointment_org_starts_idx").on(t.organisationId, t.startsAt),
    index("appointment_provider_starts_idx").on(t.providerId, t.startsAt),
    index("appointment_pet_idx").on(t.petId),
    index("appointment_owner_idx").on(t.ownerId),
    // The double booking guard is an exclusion constraint on provider and time
    // range, added in the migration by hand because Drizzle cannot express it:
    // EXCLUDE USING gist (provider_id WITH =, tstzrange(starts_at, ends_at) WITH &&)
    // WHERE (status NOT IN ('cancelled', 'no_show'))
  ],
);

export const visit = pgTable(
  "visit",
  {
    id: id(),
    organisationId: organisationId(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    petId: text("pet_id")
      .notNull()
      .references(() => pet.id, { onDelete: "cascade" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => provider.id, { onDelete: "restrict" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    notes: text("notes").notNull(),
    administered: jsonb("administered").$type<string[]>().notNull().default([]),
    paymentMethod: paymentMethod("payment_method"),
    paymentRef: text("payment_ref"),
    createdByMemberId: text("created_by_member_id").references(() => member.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("visit_org_idx").on(t.organisationId), index("visit_pet_idx").on(t.petId), uniqueIndex("visit_appointment_idx").on(t.appointmentId)],
);

export const reminder = pgTable(
  "reminder",
  {
    id: id(),
    organisationId: organisationId(),
    petId: text("pet_id")
      .notNull()
      .references(() => pet.id, { onDelete: "cascade" }),
    kind: recallKind("kind").notNull(),
    dueOn: date("due_on").notNull(),
    message: text("message").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentByMemberId: text("sent_by_member_id").references(() => member.id, { onDelete: "set null" }),
  },
  (t) => [index("reminder_org_due_idx").on(t.organisationId, t.dueOn), uniqueIndex("reminder_pet_kind_due_idx").on(t.petId, t.kind, t.dueOn)],
);

export const auditEvent = pgTable(
  "audit_event",
  {
    id: id(),
    organisationId: organisationId(),
    actorMemberId: text("actor_member_id").references(() => member.id, { onDelete: "set null" }),
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    entityType: auditEntity("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    entityLabel: text("entity_label").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_org_at_idx").on(t.organisationId, t.at)],
);

/**
 * Per IP counters for the public booking endpoint. Not tenant data, so no
 * organisation_id, and the scoping test allows it by name.
 */
export const rateLimit = pgTable("rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export const organisationTenantRelations = relations(organization, ({ many }) => ({
  services: many(service),
  providers: many(provider),
  owners: many(owner),
  pets: many(pet),
  appointments: many(appointment),
}));

export const ownerRelations = relations(owner, ({ many, one }) => ({
  pets: many(pet),
  organisation: one(organization, { fields: [owner.organisationId], references: [organization.id] }),
}));

export const petRelations = relations(pet, ({ one, many }) => ({
  owner: one(owner, { fields: [pet.ownerId], references: [owner.id] }),
  appointments: many(appointment),
  visits: many(visit),
}));

export const appointmentRelations = relations(appointment, ({ one }) => ({
  pet: one(pet, { fields: [appointment.petId], references: [pet.id] }),
  owner: one(owner, { fields: [appointment.ownerId], references: [owner.id] }),
  service: one(service, { fields: [appointment.serviceId], references: [service.id] }),
  provider: one(provider, { fields: [appointment.providerId], references: [provider.id] }),
}));

/** Tables that carry tenant data. The scoping test walks this list. */
export const tenantTables = { service, provider, owner, pet, appointment, visit, reminder, auditEvent } as const;

export const currentTimestamp = sql`now()`;
