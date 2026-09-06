# Pages

Every page in v1, by surface, with who can reach it. Derived from
`../product/roles.md`, `../product/features.md` and `../product/data-model.md`
on 2026-09-05. Routes are the intended ones and the build may move them, but a
page that is not on this list is not in v1.

Roughly 49 screens across six surfaces, plus five rendered message templates.

## Marketing and legal

Public, no account. Clinic pages read that clinic's real rows.

| Page | Route | Notes |
| --- | --- | --- |
| Landing | `/` | Built after F4. Pesos, Northern Mindanao named, the recall story, buttons to staff sign in and to create a clinic. |
| Privacy | `/privacy` | RA 10173. Ships with v1. |
| Deletion request | `/privacy/request` | The working contact route. Form with honeypot, rate limited. |
| Demo entry | `/demo` | Parked with F4. Not in the current codebase. |
| Not found and error | shared | Clinic slug not found, booking reference not found, generic error. |

## Public booking

Pet owner, no account, per clinic. Mobile first, one handed.

| Page | Route | Notes |
| --- | --- | --- |
| Clinic page | `/[clinic]` | Name, address, hours, clinic time zone labelled, services, book button. Photograph in the header. |
| Choose service | `/[clinic]/book` | Duration and price per service. |
| Choose vet | | Named vet or "any available". |
| Choose date and slot | | The slot picker. Designed in the browser against real availability, not as a picture. |
| Your details | | Name, mobile, email, pet name and species, hidden honeypot. |
| Review and confirm | | The last step before commitment. Clinic time shown with its zone. |
| Confirmation | `/[clinic]/b/[ref]` | Reference number and the confirmation message rendered on screen, since nothing is sent. |
| Manage booking | `/[clinic]/b/[ref]` | The same page later. View, cancel and reschedule the owner's own booking. |

States that decide this surface: every slot booked with a next available
suggestion, the next three days empty shown honestly, the slot taken while
typing, rate limited, and the Neon cold start skeleton.

## Client portal

Pet owner, signed in. A small surface.

| Page | Route | Notes |
| --- | --- | --- |
| Sign in | `/me` | See the open question on identity below. |
| My appointments | `/me/appointments` | Upcoming and past. |
| Appointment detail | `/me/appointments/[id]` | Cancel, reschedule. |
| My pets | `/me/pets` | |
| Pet detail | `/me/pets/[id]` | Species, breed, birth date, what is due next, visit dates. No staff notes. |

## Staff auth and onboarding

Designed first. The reference board and its prompt are in `explorations/`.

| Page | Route | Who | Notes |
| --- | --- | --- | --- |
| Sign in | `/sign-in` | staff | Email, password, links to reset and to create a clinic, a privacy link. States: error, loading, dark. |
| Sign up | `/sign-up` | staff | Name, email, password of ten characters or more. Lands on create clinic. |
| Accept invitation | `/invite/[token]` | staff | Title carries the clinic name and wraps. Guide card from the inviter explains the role. States: already signed in, expired. |
| Reset password | `/reset` | staff | Request, sent, new password, expired link. The link is emailed when Resend is configured and logged to the server console otherwise. |
| Create clinic | `/new` | owner | Name, booking address with the fixed prefix and a taken state, time zone with the current clinic time. F1 done criterion. |
| First run | `/app/[org]` | owner | Inside the staff shell. A checklist of white cards: add services, set hours, invite staff, share the booking link. |
| Choose clinic | `/app` | staff | For people with two memberships, with a last opened tag. Also the switcher in the top bar. States: empty, loading. |

## Staff application

One shell, role gated. Laptop first, dense, no photography. The navigation
shows only what the role can reach, and every page is enforced on the server
regardless.

| Page | Route | Who | Notes |
| --- | --- | --- | --- |
| Day view | `/app/[org]` | all staff | The home. Defaults to the next day with appointments and says so. A vet defaults to their own column. Designed against the bad Tuesday. |
| Appointment detail | drawer | all staff | Status, pet, owner, service, vet, notes relevant to the booking. |
| New appointment | dialog | front desk, owner | Staff booking through the same availability engine. |
| Walk-in | dialog | front desk, owner | No service required. |
| Reschedule | dialog | front desk, owner | Reuses the slot picker. |
| Cancel | dialog | front desk, owner | Reason, feeds the audit trail. |
| Clients | `/app/[org]/clients` | all staff | Search by name or mobile. A missing mobile is a real state. |
| Client detail | `/app/[org]/clients/[id]` | all staff | Contact, pets, appointments. Read only for a vet. |
| New or edit client | form | front desk, owner | |
| Client export | `/app/[org]/clients/[id]/export` | owner | Everything held about one client, printable. Reached from the data requests card on the client page. |
| Pets | `/app/[org]/pets` | all staff | Search. A vet's main way in. |
| Pet record | `/app/[org]/pets/[id]` | all staff | Identity, recall dates, weight, visit history. Front desk sees dates and appointments, not visit notes. |
| New or edit pet | form | front desk, owner | |
| Add visit | `/app/[org]/pets/[id]/visit` | vet, owner | Weight, notes, what was administered, cash or GCash reference. Updates the recall dates. |
| Visit detail | | vet, owner | Front desk sees that a visit happened, not its content. |
| Recall queue | `/app/[org]/recall` | front desk, owner | Due this week grouped by vaccination, deworming and grooming. Message rendered, copy button, mark sent. Filters for overdue and next week. |
| Reminder log | `/app/[org]/recall/log` | front desk, owner | What was generated, when, and who marked it sent. |
| Settings: clinic | `/app/[org]/settings` | owner | Name, slug, address, contact, time zone, public booking URL. |
| Settings: services | `/app/[org]/settings/services` | owner | List and edit. Name, duration, buffer, price, publicly bookable. |
| Settings: staff | `/app/[org]/settings/staff` | owner | Members, invite, change role, remove. |
| Settings: hours | `/app/[org]/settings/hours` | owner | Weekly rules per vet or groomer. |
| Settings: closures | `/app/[org]/settings/closures` | owner | Leave and clinic closures, the exceptions the engine reads. |
| Settings: recall rules | `/app/[org]/settings/recall` | owner | Grooming interval and message wording. Vaccination and deworming intervals shown but fixed. |
| Audit trail | `/app/[org]/audit` | owner | Filter by actor, action, entity and date. |
| Audit event | `/app/[org]/audit/[id]` | owner | Before and after side by side. |

## Sandbox

F4, parked. Nothing in this section exists in the current codebase. Mostly
components layered over the staff application rather than new pages.

| Item | Notes |
| --- | --- |
| Sandbox bar | On every staff page. Role switcher across all four roles, time remaining, "this demo sends nothing". |
| Guided tour | A short overlay, a handful of steps, dismissable, respects reduced motion. |
| Reminder preview | A static panel marked "coming next" showing a vaccination due message. Replaced by the real queue at F7. |
| Pet owner role | Switches to the seeded owner's client portal and the sandbox clinic's booking page. |
| Sandbox expired | Cookie past 24 hours or tenant purged. Offer to start a fresh one. |

## Rendered message templates

Shown in the interface and written to the log. Nothing is sent in v1, so these
are screens, not emails.

- Booking confirmation
- Cancellation and reschedule confirmation
- Vaccination due
- Deworming due
- Grooming due

## Open questions this list forces

None are decided. Each changes a page, so they need settling before that page
is designed. Recommendations are marked, and the decision goes in
`../product/decisions.md` when it is made.

1. **Client portal identity.** Decided: a magic link to the email given at booking, and manage booking reachable by reference alone.
2. **Booking captures a pet.** The data model joins appointments to pets, so the public form needs at least pet name and species. The features doc lists only name, mobile and email. Recommended: add the two fields.
3. **Who marks completed.** Statuses include completed but no feature assigns it. Recommended: adding a visit completes the appointment.
4. **Reporting.** The roles doc gives the owner "whatever reporting exists". Nothing in v1 defines any, so there is no reports page here.

## Not pages

`robots.txt`, the cleanup job, and the case study, which lives on cjjutba.dev.
