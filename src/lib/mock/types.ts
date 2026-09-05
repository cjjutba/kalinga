// Shapes for the in-memory prototype. They mirror docs/product/data-model.md
// closely enough that the real Drizzle schema in F1 can replace them without
// the screens noticing. Every tenant-owned record carries organisationId.

export type Role = "owner" | "vet" | "front_desk" | "pet_owner";

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentSource = "online" | "staff" | "walk_in";

export type Species = "dog" | "cat";

export type RecallKind = "vaccination" | "deworming" | "grooming";

export type PaymentMethod = "cash" | "gcash";

export interface Organisation {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  mobile: string;
  email: string;
  timezone: string;
  /** Clinic opening hours in local time, 24h "HH:mm". Open seven days. */
  openFrom: string;
  openTo: string;
  groomingIntervalWeeks: number;
}

export interface Member {
  id: string;
  organisationId: string;
  name: string;
  email: string;
  role: Role;
  /** Set when the member is also a provider on the schedule. */
  providerId?: string;
  invitedAt: string;
  lastActiveAt?: string;
}

export interface Service {
  id: string;
  organisationId: string;
  name: string;
  durationMin: number;
  bufferMin: number;
  pricePhp: number;
  publiclyBookable: boolean;
  recallKind?: RecallKind;
}

export interface WeeklyRule {
  /** 0 is Sunday, matching Date.getDay(). */
  day: number;
  from: string;
  to: string;
}

export interface ProviderException {
  /** ISO date, YYYY-MM-DD, in clinic local time. */
  date: string;
  reason: string;
}

export interface Provider {
  id: string;
  organisationId: string;
  name: string;
  title: "Vet" | "Groomer";
  weeklyHours: WeeklyRule[];
  exceptions: ProviderException[];
}

export interface Owner {
  id: string;
  organisationId: string;
  name: string;
  mobile?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  organisationId: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  sex: "male" | "female";
  /** ISO date. */
  birthDate: string;
  weightKg?: number;
  lastVaccination?: string;
  lastDeworming?: string;
  lastGroom?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  organisationId: string;
  /** Short human reference shown to the pet owner, e.g. KLG-4F7Q. */
  reference: string;
  ownerId: string;
  petId: string;
  /** Null for a walk-in that has not picked a service. */
  serviceId: string | null;
  providerId: string;
  /** ISO timestamps in UTC. Rendered in clinic time. */
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  note?: string;
  cancelReason?: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  organisationId: string;
  appointmentId: string;
  petId: string;
  providerId: string;
  at: string;
  weightKg?: number;
  notes: string;
  administered: string[];
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
}

export interface Reminder {
  id: string;
  organisationId: string;
  petId: string;
  kind: RecallKind;
  /** ISO date the item is due. */
  dueOn: string;
  message: string;
  generatedAt: string;
  sentAt?: string;
  sentByMemberId?: string;
}

export interface AuditEvent {
  id: string;
  organisationId: string;
  actorMemberId: string;
  actorName: string;
  action: string;
  entityType: "appointment" | "pet" | "owner" | "visit" | "member" | "service" | "provider" | "reminder" | "organisation";
  entityId: string;
  entityLabel: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  at: string;
}

export interface Fixtures {
  organisations: Organisation[];
  members: Member[];
  services: Service[];
  providers: Provider[];
  owners: Owner[];
  pets: Pet[];
  appointments: Appointment[];
  visits: Visit[];
  reminders: Reminder[];
  audit: AuditEvent[];
}
