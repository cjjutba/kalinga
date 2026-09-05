<img src="public/brand/kalinga-mark.svg" alt="" width="72">

# Kalinga

Booking, records and recall reminders for veterinary clinics in the Philippines.

*Kalinga* means tender care. It is what a clinic sells and what the software is
supposed to protect.

**Status: live on real data.** Every page in
[`docs/design/pages.md`](./docs/design/pages.md) runs against Postgres at
[kalinga.cjjutba.dev](https://kalinga.cjjutba.dev). Staff sign in with Better
Auth, clinics are organisations, every tenant table is scoped, the availability
engine is tested, and the public booking page writes real appointments. There is
no seed or demo data: to see it, create a clinic. The design system is settled in
[`DESIGN.md`](./DESIGN.md), the boards that settled it are in
[`docs/design/explorations/`](./docs/design/explorations/README.md), and the
decisions are in [`docs/product/decisions.md`](./docs/product/decisions.md).

```bash
pnpm install && pnpm dev
```

Copy `.env.example` to `.env.local` and fill in a Neon connection string and a
Better Auth secret, then run `pnpm db:migrate`. Open `http://localhost:3000/sign-up`,
create a clinic, add a service and a vet under Settings, and book from
`/[your-slug]`. Without `RESEND_API_KEY`, invitation, reset and sign in links
are printed to the server console.

## What it does

A pet owner books on their phone. The clinic sees the day, checks the pet in,
and writes what happened. The system remembers what is due next, which is the
part clinics currently do from memory and a notebook.

Vaccinations run annually, deworming quarterly, grooming every four to six
weeks. Those recall cycles are revenue clinics already earn and routinely forget
to collect. That is the product.

## Why it exists

Two jobs at once.

It is a real product aimed at veterinary clinics in Northern Mindanao, chosen
because a scan of the region found more qualifying vets than dental clinics, and
the median vet has roughly double the customer volume.

It is also a portfolio piece that a stranger can open and use without an
account, which the confidential client work it sits beside cannot offer.

## Stack

Next.js 16 on the App Router, Postgres on Neon, Drizzle, Better Auth, Tailwind
v4 with shadcn, Resend, deployed on Vercel. No separate API service, no native
app, no payment gateway. The reasoning for each is in
[`AGENTS.md`](./AGENTS.md).

## Documentation

Start with [`AGENTS.md`](./AGENTS.md), which is the operating manual.
[`DESIGN.md`](./DESIGN.md) covers the design system.
[`docs/`](./docs/README.md) holds the product brief, the feature breakdown, the
data model, the decision log and the development workflow.

## Licence

All rights reserved. The code is public so it can be read as evidence of how the
product is built. It is not licensed for reuse. See [`LICENSE`](./LICENSE).
