# Features

Eight features. The order is chosen so that whenever you stop, what exists is
still shippable. That property matters more than any individual feature.

Each one is deployed before the next one starts. See `../workflow.md`.

**Review depth** is either normal or deep. Deep means an adversarial pass looking
for tenancy leaks, permission holes and abuse paths. It is reserved for the four
features where a bug leaks one clinic's data into another's view.

---

## F1 Foundation

Tenancy, auth, organisation creation, and the seeded demo clinic.

Schema with `organisation_id` on every tenant table. The scoped query layer, and
the test that fails the build when a query forgets to scope. Better Auth wired
with organisations and members. One seeded clinic with invented data.

**Done when** an organisation can be created, a member can sign in, the scoping
test passes, and the empty application is deployed to Vercel on a real URL.

**Review: deep.** Tenancy is the one bug class that would end the project.

---

## F2a Availability engine

A pure module in `src/lib/availability/`. No database imports, no React, no Next.

Given working hours, exceptions, existing appointments, service duration and
buffer, a date range and a timezone, return open slots.

**Done when** the tests pass. A normal day, a fully booked day, partial
availability, buffer overlap, a closure exception, a service longer than the
remaining window, and the midnight boundary.

**Nothing renders until this is green.** It is the only part of the product where
correctness is subtle and the failure mode is double booking a real customer.

**Review: deep.**

---

## F2b Public booking

The page a pet owner actually uses, at a per-clinic URL.

Pick a service, pick a vet or accept any, see real availability from F2a, enter
name and mobile and email, confirm, get a reference. Mobile first. Rate limited
per IP with a honeypot field.

**Done when** a stranger on a phone can complete a booking against the read-only
demo clinic and the appointment appears in the database.

**Review: deep.** It is an unauthenticated public write path.

---

## F3 Staff day view

One screen that runs the day. Today's appointments in time order, with confirm,
cancel, reschedule and mark arrived.

Defaults to the next day that has appointments rather than to today, and says
which day it is showing. Survives sixteen appointments, wrapping names, a missing
mobile number, and a walk-in with no service.

**Done when** a receptionist could run a real morning from it without touching
anything else.

**Review: normal.**

---

## F4 Demo sandbox

The feature that makes it a portfolio piece.

A per-visitor ephemeral organisation, seeded on creation, reachable by an
explicit click and never by a page load. A role switcher so a visitor can see the
staff side as any of the four roles. A short guided tour. The scheduled cleanup
job. `robots.txt` disallowing the sandbox paths.

Add the reminder preview here. A static panel showing what a vaccination-due
reminder will look like, marked as coming next. It costs about an hour and it
makes the clinic conversation land.

**Done when** a stranger with no account can click into the staff side, act as
any role, and nothing they do is visible to the next visitor.

**Review: deep.** Isolation is the whole point of it.

---

## Checkpoint

Stop here. Deploy, then take it to one veterinary clinic from the regional scan.

At this point the product is genuinely demonstrable and nothing after this should
be built on assumptions. Ask what they actually do about recall today, what they
do when someone does not turn up, and who touches the logbook.

Be honest in that conversation that they are seeing the least valuable half. The
reminder queue is what they will care about and it is not built yet.

---

## F5 Patient records

Pets and their owners. Name, species, breed, birth date, owner contact, visit
history. Weight and vaccination dates, because recall depends on them.

Not diagnoses and not prescriptions. The moment it holds clinical data it becomes
a different product with a different compliance burden.

**Done when** a vet can open a pet mid-consultation, see what was done last time,
and add today's visit.

**Review: normal.**

---

## F6 Roles and permissions

The four roles enforced properly rather than by hiding buttons. Owner, vet, front
desk, pet owner. See `roles.md`.

Every permission checked on the server. A test per role asserting what it cannot
reach.

**Done when** a front desk account is provably unable to reach owner-only data by
guessing a URL.

**Review: deep.**

---

## F7 Reminder queue

The revenue feature.

Rules that decide what is due. Vaccination annually from the last dose, deworming
quarterly, grooming on a configurable interval. A queue showing what is due this
week, rendered messages ready to send, and a log of what was generated.

**It sends nothing in v1.** Staff copy the message and send it however they
already talk to that client. That is honest, it costs nothing, and it is close to
what clinics do today.

**Done when** a clinic can open one screen on a Monday and see every animal due
that week, with the message written.

**Review: normal.**

---

## F8 Audit trail

Append only. Actor, action, entity, before and after state, timestamp.

Covers appointment changes, record edits, permission changes and cancellations.

**Done when** the clinic owner can answer who cancelled an appointment and when.

**Review: normal.**

---

## After v1

The landing page, which comes after F4 rather than before, because marketing for
something that does not work yet is how a week disappears.

Then the case study, which is the actual portfolio deliverable. The application
is evidence for it.

Deferred and defensible: real SMS once a clinic pays for it, payments, a native
app, multi-branch, row level security as hardening, and a dental vocabulary swap
if the second vertical is worth chasing.
