# Features

Eight features, and a ninth added once real data made it necessary. The order is
chosen so that whenever you stop, what exists is still shippable. That property matters more than any individual feature.

Each one is deployed before the next one starts. See `../workflow.md`.

**Review depth** is either normal or deep. Deep means an adversarial pass looking
for tenancy leaks, permission holes and abuse paths. It is reserved for the four
features where a bug leaks one clinic's data into another's view.

---

## F1 Foundation

Tenancy, auth, organisation creation, and every screen rewired to real rows.

Schema with `organisation_id` on every tenant table. The scoped query layer, and
the test that fails the build when a query forgets to scope. Better Auth wired
with organisations and members. No seeded clinic: the first clinic is created
through the real sign up, and the codebase carries no sample data.

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

**Parked.** Not in the current build. The codebase carries no seed, mock or demo
data until the real flows have been used by a clinic. The spec below stands for
when it returns.

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

**Shipped 2026-09-06.** The four roles enforced properly rather than by hiding
buttons. Owner, vet, front desk, pet owner. See `roles.md`.

Every permission checked on the server. Every staff page calls
`requirePagePermission` before it renders and a guessed URL returns a 403 with
the refusal drawn inside the shell. The payload the shell receives is filtered
through `visibleSnapshot`, so the audit trail, pending invitations and visit
notes never leave the server for a role that may not see them. A test per role
asserts what it cannot reach, another reads every page file and fails the
build if a route is missing its guard, and a third pins the visibility filter.

**Done when** a front desk account is provably unable to reach owner-only data by
guessing a URL. It is: `/app/[org]/settings`, `/audit` and `/pets/[id]/visit`
answer 403 to a front desk session.

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

## F9 Privacy requests

**Shipped 2026-09-06.** The privacy notice promises a copy of a person's data
and deletion within fifteen days. Until now nothing in the product could do
either.

Owner role only, behind a new `privacy_requests` permission. From a client's
page: export a copy, a printable page of everything held about that client and
their animals, and delete the client, which removes the pets, appointments,
visits and reminders through the database cascades and scrubs the person's name
and details from the audit trail while keeping the events. The deletion itself is
recorded with counts and a reason, never a name.

**Done when** an owner can answer both kinds of request from the client's page
without touching the database, and a front desk account cannot reach either.

**Review: deep.** It deletes real data and edits the audit trail.

---

## After v1

The landing page, which comes after F4 rather than before, because marketing for
something that does not work yet is how a week disappears.

Then the case study, which is the actual portfolio deliverable. The application
is evidence for it.

Deferred and defensible: real SMS once a clinic pays for it, payments, a native
app, multi-branch, row level security as hardening, and a dental vocabulary swap
if the second vertical is worth chasing.
