import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { appointment, auditEvent, invitation, member, organization, owner, pet, provider, reminder, service, user, visit } from "./schema";

// Row types inferred from the schema. Screens import these. The names match
// the prototype's shapes so the components did not have to change when the
// source did.

export type Organisation = InferSelectModel<typeof organization>;
export type Member = InferSelectModel<typeof member>;
export type Invitation = InferSelectModel<typeof invitation>;
export type User = InferSelectModel<typeof user>;
export type Service = InferSelectModel<typeof service>;
export type Provider = InferSelectModel<typeof provider>;
export type Owner = InferSelectModel<typeof owner>;
export type Pet = InferSelectModel<typeof pet>;
export type Appointment = InferSelectModel<typeof appointment>;
export type Visit = InferSelectModel<typeof visit>;
export type Reminder = InferSelectModel<typeof reminder>;
export type AuditEvent = InferSelectModel<typeof auditEvent>;

export type NewService = InferInsertModel<typeof service>;
export type NewProvider = InferInsertModel<typeof provider>;
export type NewOwner = InferInsertModel<typeof owner>;
export type NewPet = InferInsertModel<typeof pet>;
export type NewAppointment = InferInsertModel<typeof appointment>;
export type NewVisit = InferInsertModel<typeof visit>;
export type NewReminder = InferInsertModel<typeof reminder>;
export type NewAuditEvent = InferInsertModel<typeof auditEvent>;

export type Role = "owner" | "vet" | "front_desk";
export type AppointmentStatus = Appointment["status"];
export type AppointmentSource = Appointment["source"];
export type Species = Pet["species"];
export type RecallKind = Reminder["kind"];
export type PaymentMethod = NonNullable<Visit["paymentMethod"]>;

export type { WeeklyRule, ProviderException } from "./schema";
