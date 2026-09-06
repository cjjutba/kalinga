"use client";

import { placeholder } from "@/content/placeholders";
import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/primitives/mark";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Card, GuideCard, Row, Sheet } from "@/components/primitives/surfaces";
import { StatusPill, type StatusKey } from "@/components/primitives/status-pill";
import { Photo } from "@/components/primitives/photo";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { routeGroups } from "@/content/routes";
import { ChevronRight } from "lucide-react";

// Internal. Every token, primitive and status treatment on one page, in both
// themes, so a change to the system is judged here before it reaches a screen.
// Also the directory of every route in pages.md, for walking the prototype.

const swatches: { token: string; cls: string; use: string }[] = [
  { token: "--page", cls: "bg-page", use: "Page background" },
  { token: "--sheet", cls: "bg-sheet", use: "Sheets, cards, inputs on the page" },
  { token: "--field", cls: "bg-field", use: "Inputs and guide cards on a sheet" },
  { token: "--divider", cls: "bg-divider", use: "Rare. Table rows in dense views" },
  { token: "--pill-2", cls: "bg-pill-2", use: "Secondary pill" },
  { token: "--tint", cls: "bg-tint", use: "Featured content cards only" },
  { token: "--action", cls: "bg-action", use: "Primary pill" },
  { token: "--action-pressed", cls: "bg-action-pressed", use: "Primary pill pressed" },
  { token: "--text", cls: "bg-text", use: "Primary text, icons, links" },
  { token: "--text-2", cls: "bg-text-2", use: "Secondary text" },
  { token: "--text-3", cls: "bg-text-3", use: "Placeholder only" },
  { token: "--error", cls: "bg-error", use: "Field ring and helper text only" },
  { token: "--status-noshow", cls: "bg-status-noshow", use: "No-show pill" },
  { token: "--status-overdue", cls: "bg-status-overdue", use: "Overdue pill, recall only" },
];

const statuses: StatusKey[] = ["booked", "confirmed", "arrived", "completed", "cancelled", "no_show", "overdue", "due"];

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-heading font-medium">{title}</h2>
        {note ? <p className="mt-1 text-small text-text-2">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function DesignSheet() {
  const [species, setSpecies] = useState("dog");
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Lockup size="lg" href="/" />
          <p className="mt-2 text-small text-text-2">Design sheet. Internal, not indexed. Everything in DESIGN.md, rendered.</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-14">
        <Section title="Colour" note="Fourteen tokens and four status colours. Nothing else has a colour of its own.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {swatches.map((s) => (
              <li key={s.token} className="flex flex-col gap-2">
                <div className={`h-16 rounded-guide ${s.cls} ${s.cls === "bg-page" || s.cls === "bg-sheet" ? "ring-1 ring-divider ring-inset" : ""}`} />
                <div>
                  <p className="text-label font-medium">{s.token}</p>
                  <p className="text-label text-text-2">{s.use}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Type" note="Five sizes. Hierarchy from weight and colour, not size. Sentence case everywhere.">
          <Card className="flex flex-col gap-4 p-6">
            <p className="text-title font-medium">Page title, 28 px medium</p>
            <p className="text-heading font-medium">Card title, 20 px medium</p>
            <p className="text-body">Body, 17 px. Names wrap. A Filipino name that needs two lines gets two lines.</p>
            <p className="text-small text-text-2">Secondary, 15 px in text-2. Used for helper copy and the guide card body.</p>
            <p className="text-label font-medium">Field label, 13 px medium</p>
            <p className="text-body tabular">Tabular figures for the day view: 9:30 AM, 10:15 AM, 11:00 AM</p>
          </Card>
        </Section>

        <Section title="The mark" note="Same geometry as public/brand. Never coloured, never given a third dot.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex flex-col gap-6 p-6">
              <Lockup size="lg" />
              <Lockup size="md" />
              <Lockup size="sm" />
              <div className="flex items-end gap-6 text-text">
                <Mark className="h-16 w-auto" />
                <Mark className="h-10 w-auto" />
                <Mark className="h-6 w-auto" />
                <Mark className="h-4 w-auto" />
              </div>
            </Card>
            <div className="relative overflow-hidden rounded-card">
              <Photo className="h-full min-h-56" caption="Photograph" />
              <div className="absolute left-5 top-5">
                <Lockup size="md" tone="inverse" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Pills" note="52 px on phone, 48 px on a desk. Primary, secondary, text. Loading is a spinner inside the pill.">
          <Card className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Pill>Sign in</Pill>
              <Pill variant="secondary">Create an account</Pill>
              <Pill variant="text">Forgot password?</Pill>
              <Pill loading loadingLabel="Signing in">
                Sign in
              </Pill>
              <Pill disabled>Disabled</Pill>
              <Pill variant="danger">Cancel appointment</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Pill size="sm">Small</Pill>
              <Pill size="sm" variant="secondary">
                Small secondary
              </Pill>
              <Pill size="xs">Tiny</Pill>
              <Pill size="xs" variant="secondary">
                Tiny secondary
              </Pill>
            </div>
            <div className="max-w-sm">
              <Pill block>Block pill</Pill>
            </div>
          </Card>
        </Section>

        <Section title="Fields" note="A field owns its label, control, helper and error. On a sheet the control is --field. Never a border.">
          <div className="grid gap-4 md:grid-cols-2">
            <Sheet className="flex flex-col gap-5 p-6">
              <InputField label="Email" type="email" placeholder={placeholder.email} />
              <InputField label="Password" type="password" placeholder={placeholder.password} helper="At least 10 characters." />
              <InputField label="Password" type="password" placeholder={placeholder.password} defaultValue="wrong" error="That password is not right. Try again or reset it." />
              <InputField label="Booking address" prefix="kalinga.cjjutba.dev/" placeholder={placeholder.bookingAddress} defaultValue="lunhaw" helper="This is the link you share with pet owners." />
              <SelectField
                label="Species"
                value={species}
                onChange={setSpecies}
                options={[
                  { value: "dog", label: "Dog" },
                  { value: "cat", label: "Cat" },
                ]}
              />
              <TextareaField label="Notes" hint="Optional" placeholder={placeholder.appointmentNote} />
            </Sheet>
            <div className="flex flex-col gap-5 rounded-sheet bg-page p-6 ring-1 ring-divider ring-inset">
              <p className="text-label text-text-2">The same fields on the page. The control becomes --sheet.</p>
              <InputField on="page" label="Search clients" placeholder={placeholder.searchClients} />
              <InputField on="page" label="Mobile" hint="Optional" placeholder={placeholder.mobile} />
            </div>
          </div>
        </Section>

        <Section title="Status" note="Seven treatments, each with a cue that is not colour. Completed adds a check, cancelled strikes through.">
          <Card className="flex flex-wrap items-center gap-3 p-6">
            {statuses.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </Card>
        </Section>

        <Section title="Surfaces" note="Sheet at 24 px, card at 20 px, guide card at 16 px. Tone separates them, never a border.">
          <div className="grid gap-4 md:grid-cols-2">
            <Sheet className="flex flex-col gap-4 p-6">
              <p className="text-heading font-medium">A sheet</p>
              <GuideCard name="Dr. Ana Reyes" initials="AR">
                I&apos;ve set you up as front desk. You&apos;ll book, reschedule and check pets in.
              </GuideCard>
              <div className="flex flex-col gap-2">
                <Row tone="field" title="Lunhaw Animal Clinic" secondary="Owner, Cagayan de Oro" trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} onClick={() => {}} />
                <Row tone="field" title="Amihan Veterinary Clinic" secondary="Vet, Iligan" trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} onClick={() => {}} />
              </div>
            </Sheet>
            <div className="flex flex-col gap-3">
              <Card className="p-5">
                <p className="text-heading font-medium">A card on the page</p>
                <p className="mt-1 text-small text-text-2">White on grey, no shadow.</p>
              </Card>
              <Card tone="tint" className="p-5">
                <p className="text-label font-medium text-text-2">Next appointment</p>
                <p className="mt-1 text-body">Kiko, 9:30 AM, Vaccination</p>
                <StatusPill status="confirmed" className="mt-3" />
              </Card>
              <Card className="flex flex-col gap-3 p-5">
                <p className="text-label text-text-2">Skeleton for the Neon cold start</p>
                <Skeleton className="h-5 w-2/3 rounded-tag bg-field" />
                <Skeleton className="h-5 w-1/2 rounded-tag bg-field" />
                <Skeleton className="h-12 w-full rounded-input bg-field" />
              </Card>
            </div>
          </div>
        </Section>

        <Section title="Every route" note="From docs/design/pages.md. A route missing here is a route nobody walks.">
          <div className="grid gap-4 md:grid-cols-2">
            {routeGroups().map((g) => (
              <Card key={g.title} className="p-5">
                <h3 className="text-body font-medium">{g.title}</h3>
                <ul className="mt-3 flex flex-col">
                  {g.routes.map((r) => (
                    <li key={r.href} className="flex items-baseline justify-between gap-3 border-t border-divider py-2 first:border-t-0">
                      <Link href={r.href} className="text-small font-medium hover:underline">
                        {r.label}
                      </Link>
                      <span className="truncate text-label text-text-2">{r.href}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
