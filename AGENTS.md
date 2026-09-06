# AGENTS.md

The operating manual for Kalinga. Read this before writing anything.

`CLAUDE.md` imports this file, so Claude Code and Codex both land here.
`DESIGN.md` owns the design system and `docs/` holds the product brief, the
feature breakdown, the data model and the workflow.

---

## Non-negotiables

1. **Build one feature at a time.** The loop is in `docs/workflow.md`. Plan, build small, review, fix, deploy, repeat. Do not start a second feature before the first is deployed and green.
2. **Deploy at feature one.** Not at the end. A portfolio piece that is not live is not a portfolio piece.
3. **Every tenant table carries `organisation_id`, and every query is scoped.** See Tenancy. This is the one bug class that would end the project.
4. **The availability engine ships before any screen consumes it.** Pure functions, tested first.
5. **Nothing costs money.** Free tiers only. No SMS provider, no payment gateway, no paid image APIs, no App Store fee.
6. **No seed, mock or demo data in the codebase for now.** Every screen runs against rows a person created through the real product. Sample clinics return as a separate feature once the real flows are proven. Reminders are never sent by SMS; they render in the UI for the desk to copy, and email goes out only when `RESEND_API_KEY` is set.
7. **This repository is public.** No secrets, ever. No real business data committed anywhere. See Repository rules.
8. **Write like a person.** No em dashes, no en dashes, no hyphen standing in for a dash. Colons introduce lists, not clauses. Semicolons are almost never right. Apply the `unslop` skill to anything that ships, including commit messages.

---

## What this is

Booking, records and recall reminders for veterinary clinics in the Philippines,
starting with Northern Mindanao.

The product's real value is recall. Vaccinations are annual, deworming is
quarterly, grooming is every four to six weeks. Clinics track this from memory
and lose the revenue when they forget. Online booking is the surface. Recall is
the reason anyone pays.

It is simultaneously a portfolio piece, which is why a stranger has to be able to
open it and use it without an account.

**Audience order.** A vet clinic owner deciding whether to pay. A founder
evaluating the developer. In that order, because a product built to impress
developers is a worse product.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router | Server actions remove the need for a separate API. One deploy target. |
| Language | TypeScript, strict | |
| Database | Postgres on **Neon** | Free tier scales to zero and wakes on request. |
| ORM | Drizzle | Serverless friendly, no binary engine. |
| Auth | Better Auth | Real organisation and member primitives, which is what multi-tenancy needs. |
| Styling | Tailwind v4, shadcn | |
| Email | Resend | Free tier. Sends only when `RESEND_API_KEY` is set. Without it every link is logged to the server console, and an invitation link is also shown to the inviter. |
| Hosting | Vercel, free tier | |

### Deliberately not used

**Supabase.** Its free tier pauses a project after about a week of inactivity
and needs a manual restore. A previous project of the author's died exactly this
way. Neon suspends and resumes itself.

**A separate API service.** Server actions and route handlers are enough for a
solo build. A second service doubles the deploy surface and the failure modes.

**Any SMS provider.** Every Philippine gateway charges per message. Reminders are
rendered and logged, and the log is visible in the UI. That is honest, it demos
well, and it costs nothing.

**A payment gateway.** Philippine clinics take cash and GCash transfers. v1
records a reference number against a visit, which is what they already do.

**A native mobile app.** Nobody installs a TestFlight build to evaluate a
developer. The client side is mobile-first web, installable as a PWA. Native
happens when a paying clinic asks for it.

---

## Architecture

One Next.js application. Marketing at the root, the product underneath it, one
deploy and one design system.

Server Components by default. `"use client"` only on interactive leaves. Server
actions for mutations, route handlers where a real HTTP endpoint is needed.

Content that is genuinely static, such as marketing copy, lives as typed data
rather than markup, following the same pattern as the author's portfolio.

---

## Tenancy

Every tenant-owned table carries `organisation_id`. There are no exceptions and
no "this one is fine because it is only settings".

Access goes through a scoped query layer that cannot be called without an
organisation id. A test fails the build if any query touches a tenant table
without scoping.

Postgres row level security is the stronger claim and Neon supports it. It is
deliberately **not** in v1, because it fights with Better Auth, and a misconfigured policy is harder to see than a missing argument in
code you can read. Revisit as hardening once the feature set is stable.

---

## Real data, and where the demo went

There is no seed data, no fixture file, no in-memory store and no demo clinic in
this codebase. The prototype's `src/lib/mock/`, `src/components/sandbox/` and
`/demo` routes were deleted when F1 landed, and nothing has replaced them.

To see the product, use it. Sign up at `/sign-up`, create a clinic at `/new`,
add a service and a vet under Settings, then book from `/[slug]`. Every row you
see was written by that path.

The public demo and the writable sandbox described in `docs/product/features.md`
under F4 are parked, not cancelled. When they return, these rules still hold:

- A sandbox is created only by a POST from an explicit click, never on a page load. A crawler must be physically unable to create a row.
- The tenant id lives in a cookie for 24 hours and a scheduled job deletes stale tenants.
- `robots.txt` disallows the sandbox paths.
- Sample appointments are generated relative to creation, never on fixed dates.
- The day view defaults to the next day that has appointments, and says which day it is showing.

---

## Time

Every timestamp is `timestamptz` and stored in UTC. The organisation row carries
a `timezone` column defaulting to `Asia/Manila`.

Availability is computed in clinic local time. The interface renders clinic time
with the zone labelled, not the viewer's, because someone booking from abroad
still has to arrive at nine in the morning Philippine time.

**No raw `Date` arithmetic anywhere in scheduling.** Use a timezone-aware library
for every calculation. This single rule prevents most scheduling bugs.

---

## The availability engine

`src/lib/availability/` is a pure module. It imports nothing from the database,
nothing from React, and nothing from Next.

One entry point. Given working hours, exceptions, existing appointments, a
service duration and buffer, a date range and a timezone, it returns open slots.

**Tests come before any screen consumes it.** At minimum: a normal day, a fully
booked day, partial availability, buffer overlap, a closure exception, a service
longer than the remaining window, and the midnight boundary.

This is the only part of the product where correctness is subtle, and the failure
mode is double booking a real customer.

---

## Privacy and abuse

Kalinga collects names, mobile numbers and email addresses from Philippine
residents. RA 10173 applies.

- A real `/privacy` page ships with v1, not later.
- Bookings and records are kept until the clinic deletes them or the person asks.
- A working contact route for deletion requests.
- The public booking endpoint is rate limited per IP and carries a honeypot field.

---

## Repository rules

This repository is **public**, licensed all rights reserved. Readable as
evidence, not licensed for reuse, because Kalinga is meant to be sold.

- No secrets in the repository. `.env.example` only.
- **Any sample data that ever ships must be visibly fictional.** No clinic names, addresses or phone numbers taken from real businesses. Invented names only. Today there is none.
- No client data from any other project, ever.

---

## Where things live

| Path | What |
| --- | --- |
| `src/app/` | Routes. Marketing at the root, product beneath it. |
| `src/components/primitives/` | The design system. See `DESIGN.md`. |
| `src/lib/design/` | The tone system. `surfaces.ts` names the four grounds a control can sit on, `palette.ts` is the only file allowed to hold a colour value, for browser chrome and email. |
| `src/lib/availability/` | The scheduling engine. Pure, tested, no side effects. `openSlots` and `isFree`, nine tests in `engine.test.ts`. |
| `src/lib/db/` | Drizzle schema, the Better Auth tables, the `Scope` query layer and the scoping test that fails the build. `queries.ts` builds the view models. |
| `src/lib/actions/` | Server actions. `apply.ts` is the one command handler behind the staff shell, `public.ts` the unauthenticated booking path, `slots.ts` the slot loaders. |
| `src/lib/auth.ts`, `session.ts`, `access.ts`, `roles.ts` | Better Auth config, the session helpers every page and action call (`requirePagePermission` for pages, `requirePermission` for actions), and the role permissions. |
| `src/lib/*.test.ts` | The tests that fail the build: scoping, a page guard on every staff route, what each role cannot reach, the visibility filter, the booking schema, the engine, and a colour written anywhere but the tokens. |
| `drizzle/` | Generated SQL migrations. `pnpm build` applies them before `next build`. |
| `src/content/` | Typed marketing and static copy, the privacy notice, the message templates, the route directory. |
| `.claude/launch.json` | Starts `pnpm dev` on port 3000 for the browser preview. |
| `docs/design/screenshots/` | Screenshots taken at the end of each build phase. |
| `public/brand/` | The mark, lockup, favicon and app icon as SVG. The geometry is the source of truth, never redraw it. The PNG icons the install manifest needs are rendered from `app-icon.svg` and `app-icon-maskable.svg` with sharp, never edited by hand. |
| `docs/product/` | Brief, features, roles, data model, decisions. |
| `docs/design/` | Visual direction, the page inventory, the screens to design. |
| `docs/design/explorations/` | Generated boards and vectors, each beside the prompt, model and price that produced it. |
| `docs/workflow.md` | The build loop and when to escalate review depth. |

---

## Definition of done

v1 is done when features one through eight are deployed, the privacy page is
live, the availability engine is tested, and the case study is written.

**Capture evidence as you build.** Add to `docs/product/decisions.md` when a
decision is made. Take screenshots at each feature completion. Save every
generated design board in `docs/design/explorations/` beside its prompt, model
and price. Track the numbers the case study will need, which are the engine
test count, the permission checks, and the accessibility and
Lighthouse scores. These are much easier to record on the day than to
reconstruct in a month.

---

## Accessibility

Match the standard already set by the author's portfolio. WCAG 2A and 2AA,
verified with axe in the test run: `src/a11y.test.tsx` renders every screen
with realistic data and fails the build on any structural violation. Colour
contrast cannot be measured without the stylesheet, so it is held by the token
table in `DESIGN.md` and checked in a browser when a token changes. Respect `prefers-reduced-motion`. The client
side is mobile-first, because pet owners book on a phone.
