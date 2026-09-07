// View models: what the screens render. Timestamps are ISO strings, numbers
// are numbers, and every tenant-owned record carries organisationId. They are
// built from database rows in src/lib/db/queries.ts and never hold a Date, so
// they cross the server to client boundary untouched.

export type Role = "owner" | "vet" | "front_desk";

export type AppointmentStatus = "booked" | "confirmed" | "arrived" | "completed" | "cancelled" | "no_show";

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
  /** Clinic opening hours in local time, 24h "HH:mm". */
  openFrom: string;
  openTo: string;
  groomingIntervalWeeks: number;
  vaccinationIntervalMonths: number;
  dewormingIntervalMonths: number;
}

export interface Member {
  id: string;
  organisationId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  /** Set when the member is also a provider on the schedule. */
  providerId?: string;
  invitedAt: string;
}

export interface Invitation {
  id: string;
  organisationId: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: string;
  createdAt: string;
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
  memberId?: string;
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
  reference: string;
  ownerId: string;
  petId: string;
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
  dueOn: string;
  message: string;
  generatedAt: string;
  sentAt?: string;
  sentByMemberId?: string;
  sentVia?: "copied" | "email";
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

/** Everything the staff shell needs for one organisation, loaded on the server per request. */
export interface OrgSnapshot {
  organisation: Organisation;
  members: Member[];
  invitations: Invitation[];
  services: Service[];
  providers: Provider[];
  owners: Owner[];
  pets: Pet[];
  appointments: Appointment[];
  visits: Visit[];
  reminders: Reminder[];
  audit: AuditEvent[];
}
