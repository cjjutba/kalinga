# Data model

A sketch, not a schema. It will be wrong in places and the build corrects it. The
tenancy rule at the bottom will not change.

## Entities

**Organisation.** The clinic. Slug for its public booking URL, display name,
timezone defaulting to `Asia/Manila`, and settings. Every other table below points
back to this.

**User** and **Member.** Auth identity, and the join that gives a user a role in
an organisation. A person working at two clinics has two memberships.

**Service.** What can be booked. Name, duration, buffer, price, and whether it is
publicly bookable. Grooming, consultation, vaccination, deworming.

**Provider.** A vet or a groomer. Their weekly working hours as recurring rules,
plus explicit exceptions for closures and leave.

**Owner** and **Pet.** The customer, and the animals belonging to them. A pet
carries species, breed, birth date, and the dates that drive recall, which are
last vaccination, last deworming and last groom.

**Appointment.** Joins service, provider and pet, with a start, an end and a
status. Booked, confirmed, arrived, completed, cancelled, no-show.

**Visit.** What happened at an appointment. Weight, notes, what was administered.
Feeds the recall dates on the pet.

**ReminderLog.** What was due, for which pet, when it was generated, the rendered
message, and whether staff marked it sent. Nothing is actually transmitted in v1.

**AuditEvent.** Actor, action, entity, before and after state, timestamp. Append
only.

## Availability, and why it is stored this way

Working hours are **recurring weekly rules plus explicit exceptions.** Not a table
of materialised slots.

A slot table has to be kept in sync with bookings, closures and hour changes, and
every double booking bug in every scheduling product lives in that sync. Slots are
computed on read instead, by the pure module described in `../../AGENTS.md`.

Granularity is fixed at fifteen minutes and is not configurable in v1.

## Tenancy

Every table above except User carries `organisation_id`.

Queries go through a scoped layer that cannot be called without one. A test fails
the build if any query touches a tenant table unscoped.

Row level security is stronger and is deliberately deferred. The reasoning is in
`../../AGENTS.md`.

## Time

Every timestamp is `timestamptz` in UTC. Availability is computed in clinic local
time. No raw `Date` arithmetic anywhere near scheduling.
