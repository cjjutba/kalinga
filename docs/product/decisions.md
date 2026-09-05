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

## Open

**The accent hue.** Decided during the design step. Must work as a small status
dot on a dense day view, as a large button on a phone in daylight, and must not
read as an alert.

**The offer to the first clinic.** Free pilot in exchange for a testimonial and a
case study, or paid from the start. Needs settling before the F4 conversation
happens, not during it.

**The type scale.** Small and fixed, numbers written back into `DESIGN.md` once
the design step lands.
