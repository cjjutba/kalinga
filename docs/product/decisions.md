# Decision log

Append only. When a decision changes, add a new entry that supersedes the old one
rather than editing history.

---

## 2026-09-05

### Vertical is veterinary, not dental

A scan of qualifying businesses across Northern Mindanao returned 37 veterinary
clinics against 33 dental, and the median vet carried 20 reviews against 12 for
the median dental clinic. More targets and each one busier.

Three supporting reasons. Veterinary has several recall cycles running at once
rather than dental's single six month one. A grooming client books monthly where
a dental patient books twice a year, so the system is used far more. And pet
records carry no personal health information, which matters for a public demo
with no login.

The initial instinct was dental. The data changed it.

### Name is Kalinga

Filipino for tender care. It travels across verticals, so a dental or
dermatology version later does not need a rename.

Considered and rejected: Fetch, which was the strongest name but is dog-coded and
would not survive a vertical change. Alaga, Bantay, Tend, Slate, Rounds.

### Postgres on Neon, not Supabase

Supabase's free tier pauses a project after roughly a week of inactivity and
requires a manual restore. A previous project of the author's died exactly this
way and was still returning 500 months later. Neon suspends and resumes itself,
so a portfolio piece that goes untouched for a month still answers.

### No separate API service

The author's client work used NestJS because three portals shared one API under a
client requirement. Here a second service would double the deploy surface and the
failure modes for no benefit. Next.js server actions and route handlers are
enough.

### No SMS provider, no payment gateway, no native app

All three cost money and none of them is what makes the product convincing.

Reminders are rendered and logged, and staff send them through whatever channel
they already use. Payments record a GCash or cash reference against a visit,
which is what clinics already do. The client side is mobile-first web installable
as a PWA, because nobody installs a TestFlight build to evaluate a developer.

Each becomes justifiable the moment a clinic is paying.

### The demo splits into two surfaces

A shared read-only clinic backs the marketing and public booking pages and is
never written to. A per-visitor ephemeral organisation backs the staff sandbox
and is created only by an explicit click, never on a page load.

Without that split, every crawler, link unfurl and uptime ping would create a
seeded tenant, and a shared writable demo would show the first visitor's
vandalism to everyone until a reset.

### Seed data is generated relative to now

Fixed dates age. The demo clinic opens seven days, which removes the closed-day
problem, and the day view defaults to the next day with appointments rather than
today. A visitor arriving on a Sunday evening sees a working product.

### Timezone decided before any code

Every timestamp is `timestamptz` in UTC. Organisations carry a timezone defaulting
to `Asia/Manila`. Availability computes in clinic local time and the interface
renders clinic time with the zone labelled, because someone booking from abroad
still has to arrive at nine in the morning local.

No raw `Date` arithmetic anywhere in scheduling.

### The availability engine ships before any screen

A pure module with tests, built before anything renders. It is the only part of
the product where correctness is subtle, and the failure mode is double booking a
real customer.

Availability is stored as recurring weekly rules plus exceptions, and slots are
computed on read. A materialised slot table has to be kept in sync with bookings,
closures and hour changes, and that sync is where scheduling bugs live.

### Feature order optimises for shippability, not customer value

Every feature is ordered so that stopping at any point still leaves something
live. That puts the reminder queue near the end even though it is the feature
clinics actually pay for, because it does not demonstrate well to a stranger.

Accepted knowingly. A static reminder preview lands in F4 so the first clinic
conversation still includes it.

### Build generic first, adapt after F4

Build for a fictional clinic, reach the point where it is demonstrable, then take
it to a real one before building anything further. Avoids both the dependency on
a clinic replying and the trap of building fifteen features on assumptions.

### Repository is public, licensed all rights reserved

Public because it is evidence a stranger can read, which the author's client work
can never be. All rights reserved rather than MIT because Kalinga is meant to be
sold, and an open licence would let a competitor fork the product.

Seed data must be visibly fictional. No names, addresses or numbers taken from
the real businesses in the regional scan.

### The sandbox sends nothing

No email and no SMS from the demo. Confirmations and reminders render in the
interface and write to a log table. This also settles what happens when a visitor
types a real email address into the demo, which is nothing.

### Privacy ships with v1

RA 10173 applies to Philippine residents' contact details, including in a demo. A
real privacy page, sandbox data purged within 24 hours, and a working route for
deletion requests. The public booking endpoint is rate limited with a honeypot.

Shipping without this would undercut the compliance rigour the author sells.

### Domain is a subdomain until a clinic says yes

`kalinga.cjjutba.dev` costs nothing. A real domain gets bought when there is a
reason to.

### The interface is not monochrome

The author's portfolio is greyscale and that is right for a portfolio. A product
called tender care cannot be, and staff need to scan a day view and see status at
a glance, which colour does faster than shape.

One accent, used only for the primary action and for status. The hue is chosen
during the design step rather than assumed here.

### Mockups express intent, references solve problems

Image generation is used to explore what the product should look like, which is a
different job from looking at what already exists. Claude Design turns the chosen
direction into clickable artboards in the real design system. Pattern libraries
get consulted only when a specific interaction is stuck.

---

## 2026-09-05, the design step

Everything below came out of generating boards for the staff sign in page and
judging them. The full account is in `../design/direction.md`.

### The interface is near white and near black

Supersedes "The interface is not monochrome" above. A grey page, white sheets
and cards, near black text and a near black primary pill. Warmth comes from
photography of animals, not from an accent. The earlier entry was right that
grey on grey would read as cold. It was wrong that colour was the only way to
fix it.

Tested against three generated boards. The earth tone board looked like paper
and its clay button read as orange. The monochrome board with a photograph read
as a product a clinic owner would pay for.

### There is no accent hue

Closes the open question. One pale blue tint, `#D9E5F5`, marks featured
content cards such as the next appointment, borrowed from how Future Pro tints
its kickoff card. Buttons, links, focus and text never take a colour. Status
keeps a small palette of its own, seven states each with a cue that is not
colour, because the day view genuinely needs it.

### Surfaces are separated by tone, not hairlines

Supersedes the hairline rule inherited from the portfolio. Cards, sheets and
inputs have no borders and no shadows. An input is always one step of tone
away from what it sits on. A form made of hairline boxes reads as a settings
page, and the first board proved it.

### Photography appears on entry surfaces only, and only animals

Auth pages, the demo entry, the landing page and the public booking header
carry one animal portrait each. Nothing inside the staff application does. The
subject rules are in `DESIGN.md`: one animal, no people, no clinic, no props,
natural light, plain wall. Aspin and puspin first.

The vet with a dog on a steel table was tried and rejected as the stock image
every clinic already has. A human face in the hero also pulled attention from
the form.

### The mark is a smile with two unequal dots

A thick arc with round caps, a small dot floating above the left end and a
larger dot resting above the right end. The brief was a dot held by an arc.
Three models read it three ways: a crescent, a power button, and this face.
The face was chosen because it reads as tender care without a paw print, and
the larger dot still reads as the thing being held.

Rebuilt as geometry in `public/brand/` from the chosen render, so the favicon,
the app icon and the lockup are all the same SVG at different sizes. The
rejected vectors are kept in `../design/explorations/logo/`.

### Staff auth is designed before public booking

Supersedes the order in the first version of `../design/screens.md`, which put
public booking first. Auth was the cheapest place to settle the system: five
pages, one form shape, every state the system has to prove. Public booking is
next and now inherits a finished system rather than defining one.

### Boards are generated with GPT Image 2 through fal, vectors with Recraft

Prices are checked with the fal pricing tool before every run, because fal
changes prices without notice. On 2026-09-05 a board at 2560 by 1440 cost
$0.222 and a vector mark cost $0.08. Nano Banana Pro was tried on the same
prompt at $0.15 and rejected for rotating phones to landscape and adding text
it was told not to. The whole design step cost about a dollar.

The fal key lives in the user level MCP config, never in the repository. It
was pasted into a chat once during setup and rotated afterwards.

### Design explorations are kept with their prompts

Every kept board and every vector goes in `../design/explorations/` beside the
exact prompt that produced it, with the model and the price. A board without
its prompt cannot be reproduced or varied, and the case study will need both.

### The phone auth photograph collapses when the keyboard opens

The phone layout puts a photograph in the top 40 percent and rises a sheet over
it. With the keyboard open the form does not fit. The photograph collapses to a
64 px band on field focus rather than letting the sheet scroll, so the primary
button stays in reach.

## 2026-09-05, the prototype

### The interface is built before the foundation

Supersedes the build order for one pass. Every page in `../design/pages.md`
was built as an interactive prototype on typed in-memory fixtures, so the
whole product can be walked on localhost before a database, auth or a server
action exists. Nothing persists past a reload. The shapes in
`src/lib/mock/types.ts` mirror the data model so the real schema in F1 can
replace them without the screens noticing.

Two non-negotiables are paused, knowingly, until F1 starts. "Deploy at feature
one" waits because there is no feature one yet, only its interface. And the
slot picker runs on a naive fixture list in `src/lib/mock/slots.ts` rather
than the availability engine. That file is labelled as such and is deleted when
F2a ships with tests. No real booking is taken from it.

### Fixtures are deterministic per day and hour

The demo clinic is generated relative to the clinic's current day, two weeks
back and three weeks forward, with today as the heavy day the design has to
survive. The server layout reads the clinic hour once and passes it down, so
the server render and hydration build the same fixtures. Ids restart on every
generation for the same reason. Audit events are never dated after now.

### The photograph placeholder is a token

`--photo` exists only so the white lockup over a placeholder passes contrast
before real photographs land. It is not part of the design system proper and
goes when the photographs arrive.

### Type utilities do not share names with colours

`text-small` and `text-heading` rather than `text-secondary` and `text-card`,
because shadcn defines colours called secondary and card and Tailwind resolved
the size utilities as colours. Found on the first render of the design sheet.

### Accessibility at the end of the prototype

Lighthouse accessibility on 2026-09-05, mobile for public pages and desktop
for staff pages: landing 96, sign in 100, day view 96, pet record 100, recall
queue 100, booking 96, confirmation 96, privacy 95. Best practices 100
everywhere. The remaining points are on `aria-allowed-role` and heading order
in the shadcn dialog primitives, recorded here so they are not rediscovered.

## 2026-09-06

### The prototype is deployed before F1

Resumes "deploy at feature one" a step early. The Vercel project is
`kalinga`, production alias `kalinga-blush.vercel.app`, with
`kalinga.cjjutba.dev` attached and waiting on a CNAME at Porkbun. Nothing on
the site needs a secret yet, so the deploy is the prototype as committed.

### Postgres lives in the Neon project `kalinga`, Singapore

Project `autumn-king-19704457` in `aws-ap-southeast-1`, Postgres 18, the
closest region to Northern Mindanao. Two branches: `main` for production,
reached only through the Vercel environment, and `dev` for local work through
`.env.local`. Both connection strings are pooled. `.env.example` lists every
variable the application will read, with no values.

### Neon tooling needs Node 22

The Neon skills CLI refuses Node 20. It runs under Bun, which is how the
`neon` and `neon-postgres` skills in `.claude/skills/` were installed. The
Neon MCP server is registered at user scope for future sessions. The Better
Auth "MCP plugin" is not a documentation server, it turns an application into
an OAuth provider for MCP clients, and is not needed for v1.

---

## 2026-09-06, F1 on real data

### There is no seed, mock or demo data, for now

The prototype ran on fixtures, an in-memory store and a per-visitor sandbox.
All of it was deleted when the database landed: `src/lib/mock/`,
`src/components/sandbox/` and the `/demo` routes are gone and nothing seeds the
database. Every feature is exercised by creating a real clinic through sign up.

**Why.** The point of F1 is to prove the product on real rows. Sample data hides
empty states, masks slow queries and makes it too easy to believe a screen works
because it renders. F4, the public sandbox, is parked and its spec kept.

### Better Auth's organisation is the tenant root

Every tenant table carries `organisation_id` referencing Better Auth's
`organization.id`. Clinic settings that Better Auth does not know about
(timezone, address, opening hours, the grooming interval) live as additional
fields on that same row rather than in a parallel clinic table.

**Why.** One id for one clinic, and the membership, invitation and role
machinery comes with it. Roles are `owner`, `vet` and `front_desk` through the
organisation plugin's access control, checked on the server at the top of every
action. Pet owners are not members: the portal signs them in with a magic link.

### The scoped query layer is a class, and a test reads the source

`Scope` in `src/lib/db/scoped.ts` is the only door to tenant tables. It takes an
organisation id at construction and every list, get, insert, update and delete
adds the scoping clause. `scoping.test.ts` reads the source tree and fails the
build if any file outside the database layer touches a query builder directly.

**Why.** A missing `where` is the one bug class that ends the project. A test
that reads code catches it at build time rather than in a customer's data.

### Postgres refuses the double booking, not only the engine

An exclusion constraint on `appointment` (`btree_gist`, one provider, the
`tstzrange` of start and end, ignoring cancelled and no-show rows) sits behind
the availability engine's own `isFree` check, which runs inside the booking
transaction.

**Why.** Two people confirming the same slot at the same second both pass the
engine. Only one passes the constraint, and the loser sees "that slot was just
taken".

### Email is optional in development

`sendEmail` uses Resend when `RESEND_API_KEY` is set. Without it, the message
is logged to the server console with its link, and an invitation link is also
returned to the inviter's screen. The privacy request form says plainly that the
request was logged rather than emailed.

**Why.** Nothing should be blocked on a mail provider while the product is being
proven, and nothing should pretend to have sent what it did not.

### Better Auth 1.7 needs its own CLI, under bun

The schema generated with `@better-auth/cli` 1.4 lacked the `issuer` column
that Better Auth 1.7 requires on `account`, which made the first sign up fail
and leave an orphan user row. The 1.7 CLI is the `auth` package and it uses
`Object.groupBy`, so on Node 20 it runs as `bunx --bun auth@1.7.2 generate`.

**Why recorded.** The failure mode is silent until the first real sign up, and
the fix is not where the docs point.

### Payloads are filtered by role, not only the navigation

`loadOrgSnapshot` takes the member's role. The audit trail, pending invitations
and visit notes are left out of the response for roles without the matching
permission, so a front desk account never receives what its screens will not
draw.

**Why.** Hiding a button is not a permission, and neither is a payload the
browser happens not to render.

### Three open questions closed by building

Client portal identity is a magic link to the booking email, with manage booking
reachable by reference alone. The public form captures pet name and species.
Adding a visit completes the appointment and sets the next recall date.

## 2026-09-06, F6 roles and permissions

### Pages refuse with a 403, and a test reads every page

Every page under `src/app/app/[org]/` starts with
`requirePagePermission(org, permission)`. When the role lacks it, Next's
`forbidden()` renders the segment's `forbidden.tsx` inside the staff shell with
a 403 status. `guards.test.ts` walks the page files, checks each one names the
permission the route map expects, and fails when a new page is added without an
entry. The portal pages are checked the same way for `requireSession`.

**Why.** "Provably unable to reach by guessing a URL" has to be a property of
the code, not a manual check. A page missing its guard now fails the build, and
a route nobody has classified cannot ship. The refusal is an HTTP status rather
than an empty screen so it can be asserted from outside the browser.

### The role matrix is written twice on purpose

`roles.test.ts` lists, for each role, exactly the permissions it must not hold
and exactly the commands `applyAction` must refuse. Changing a grant in
`roles.ts` fails this test until the same change is made to the list.

**Why.** A permission widened by accident should cost a deliberate second edit.
The lists mirror `roles.md`, so the spec, the code and the test say the same
thing.

### Input schemas and the permission map live outside "use server" files

`bookingInput` and `manageInput` moved to `src/lib/actions/schemas.ts`, and the
command to permission map to `src/lib/actions/permissions.ts`. The server action
modules import them.

**Why.** A "use server" module may only export async functions, which is what
broke clinic creation in F1. Plain modules can be unit tested without pulling in
Next or the database, so the honeypot, the mobile format and the per role
refusals are covered directly.

## 2026-09-06, F9 privacy requests

### The owner answers data requests from the client's page

A `privacy_requests` permission, granted to the owner alone, gates a printable
export of everything held about a client and a deletion that removes the
client with their pets, appointments, visits and reminders. The deletion runs in
one transaction and relies on the foreign key cascades already in the schema.

**Why.** The privacy notice promised both within fifteen days and the product
could do neither, which left the promise resting on someone opening a database
console. Roles.md already said the owner is the only role that removes data.

### The audit trail is scrubbed, not trimmed

Deleting a client rewrites the audit events that pointed at them: labels become
"Deleted record", before and after states are cleared, and events the person
performed themselves are attributed to "Deleted client". The events stay. The
deletion itself is recorded with counts and a reason and no name.

**Why.** An append only trail and a right to erasure pull against each other.
Keeping the shape of what happened while removing who it happened to satisfies
both, and the owner can still see that a deletion took place and why.

## 2026-09-06, F10 delivery

### Email is the one channel that costs nothing, so it is the first that sends

Booking confirmations, moves and cancellations now go to the pet owner by email
when they gave one and `RESEND_API_KEY` is set, from the public page and from the
desk alike. The recall queue offers "Email" beside "Copy" under the same two
conditions, and each reminder records the channel that carried it. Without the
key nothing changes: the desk copies, and the confirmation page stays the record.

**Why.** "It sends nothing" was a decision about SMS, which every Philippine
gateway charges for. Resend's free tier carries three thousand messages a
month, so refusing to email was leaving value on the table for no saving. The
copy path stays because most clients here are on Messenger, not email.

### A mail failure never fails the booking

The email is sent after the transaction commits, and an error is logged and
swallowed. The result carries only whether a message actually went out, and the
confirmation page says "a copy has gone to" only when it did.

**Why.** The appointment is the thing of value. A mail provider hiccup must not
turn a successful booking into an error screen for someone on a phone.

## 2026-09-06, design tokens

### Two light tokens darkened for AA contrast

Light `--text-2` moves from `#6B6B70` to `#656569` and light `--error` from
`#D92D20` to `#C4281C`. Neither change is visible to the eye.

Found while proving starter-kit, which carries this design system. axe
measured secondary text on the secondary pill at 4.45 to 1 and the error red
on the same pill at 4.06, both under the AA line of 4.5 for small text. The
theme toggle uses the first pair on every page. The error red was also 4.4
on the page, where helper text sits under every page surface field.

The new values put text-2 at 5.8 on the sheet and 4.9 on the pill, and the
error red at 5.7 on the sheet, 5.3 on the page and 4.8 on the pill. Dark
values were already clear and do not change. The chevron in the select
field, drawn as an inline SVG, takes the same grey so it keeps matching
secondary text.

## 2026-09-06, F11 installable

### The PWA is a manifest and icons, not a service worker

`src/app/manifest.ts` serves the web app manifest, the root metadata points at
it and carries the Apple touch icon, and four PNGs rendered from the brand SVG
give Android and iOS what they need to pin Kalinga to a home screen. It opens
on `/app`, which is the clinic's day for staff and the sign in page for anyone
else. There is no service worker and nothing works offline.

**Why.** Installability is what AGENTS.md promised, and a home screen icon is
what a receptionist needs. Offline is a different promise: the product is the
database, and a cached day view that hides a booking made from a phone in the
waiting room is worse than a spinner. When a clinic asks for offline, it gets
designed, not switched on.

### Icons are rendered, never redrawn

`icon-192.png`, `icon-512.png`, `icon-512-maskable.png` and
`apple-touch-icon.png` come from `app-icon.svg` and a full bleed
`app-icon-maskable.svg` that reuses the same path data at a smaller scale, so
Android's mask cannot clip the mark. The render command is sharp through
`pnpm dlx sharp-cli`.

**Why.** The geometry is the identity. Two SVG sources and a repeatable render
beat a folder of hand exported bitmaps that drift.

## Open

**The offer to the first clinic.** Free pilot in exchange for a testimonial and a
case study, or paid from the start. Needs settling before the F4 conversation
happens, not during it.

**Reporting.** The roles doc gives the owner "whatever reporting exists" and
nothing in v1 defines any. Recommended: none in v1.

**The two earlier ChatGPT boards.** The chosen logo renders are saved in
`../design/explorations/logo/`. The earth tone board and the monochrome board
with the vet photograph exist only as images in a chat and were not saved. If
they turn up they go in `../design/explorations/boards/` under the names in its
README. Their content and verdicts are recorded in `../design/direction.md`.
