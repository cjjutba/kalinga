"use client";

import Link from "next/link";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/primitives/pill";
import { useOrg } from "@/lib/org-data";
import { cn } from "@/lib/utils";

// What an owner sees right after creating a clinic. Three things stand between
// a new clinic and its first booking, so they are a rail with the state of
// each one on it: what is done carries a check, what is next carries the only
// filled button on the page. The booking link sits underneath, because it is
// worth nothing until there is something to book.

export function FirstRun({ orgSlug, clinicName }: { orgSlug: string; clinicName: string }) {
  const { services, providers, members, invitations } = useOrg(orgSlug);
  const base = `/app/${orgSlug}/settings`;
  const url = `kalinga.cjjutba.dev/${orgSlug}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const steps = [
    {
      title: "Add your services",
      lead: "What can be booked, how long it takes, what it costs.",
      href: `${base}/services`,
      action: "Add a service",
      done: services.length > 0,
    },
    {
      title: "Set working hours",
      lead: "Per vet or groomer, plus closures and leave.",
      href: `${base}/hours`,
      action: "Set hours",
      done: providers.some((p) => p.weeklyHours.length > 0),
    },
    {
      title: "Invite your staff",
      lead: "Front desk runs the day. Vets see their own column.",
      href: `${base}/staff`,
      action: "Invite staff",
      done: members.length > 1 || invitations.length > 0,
    },
  ];

  const left = steps.filter((s) => !s.done).length;
  const next = steps.findIndex((s) => !s.done);

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <header className="mb-8">
        <h1 className="text-title font-medium text-balance">{clinicName} is ready.</h1>
        <p className="mt-1 text-small text-text-2">
          {left === 0 ? "Everything is set. Take your first booking." : left === 3 ? "Three things before you take a booking." : left === 2 ? "Two things left before you take a booking." : "One thing left before you take a booking."}
        </p>
      </header>

      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
            {i < steps.length - 1 ? <span aria-hidden className="absolute left-[13px] top-8 bottom-0 w-px bg-divider" /> : null}
            <span
              aria-hidden
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-medium",
                step.done ? "bg-action text-on-action" : i === next ? "bg-sheet text-text ring-1 ring-text" : "bg-sheet text-text-2 ring-1 ring-divider",
              )}
            >
              {step.done ? <Check className="size-4" strokeWidth={2} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-body font-medium">
                {step.title}
                {step.done ? <span className="sr-only">, done</span> : null}
              </p>
              <p className="mt-0.5 text-small text-text-2">{step.lead}</p>
              <div className="mt-3">
                <Pill asChild size="sm" variant={i === next ? "primary" : "secondary"}>
                  <Link href={step.href}>
                    {step.done ? "Review" : step.action}
                    <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                </Pill>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-card bg-sheet p-5" aria-labelledby="booking-link">
        <h2 id="booking-link" className="text-body font-medium">
          Your booking link
        </h2>
        <p className="mt-0.5 text-small text-text-2">Share it once services and hours are in. Pet owners book on it without an account.</p>
        <div className="mt-3 flex items-center gap-2 rounded-guide bg-field p-2 pl-4">
          <span className="min-w-0 flex-1 truncate text-small tabular text-text-2">{url}</span>
          <button
            type="button"
            onClick={copy}
            className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={copied ? "Booking link copied" : "Copy booking link"}
          >
            {copied ? <Check className="size-5" strokeWidth={1.5} /> : <Copy className="size-5" strokeWidth={1.5} />}
          </button>
          <a
            href={`/${orgSlug}`}
            target="_blank"
            rel="noreferrer"
            className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="Open the booking page in a new tab"
          >
            <ExternalLink className="size-5" strokeWidth={1.5} />
          </a>
        </div>
      </section>

      <div className="mt-6">
        {left === 0 ? (
          <Pill asChild size="sm">
            <Link href={`/app/${orgSlug}`}>
              Go to today
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Pill>
        ) : (
          <Link href={`/app/${orgSlug}`} className="rounded-tag text-small font-medium text-text-2 hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
            Skip for now and go to today
          </Link>
        )}
      </div>
    </div>
  );
}
