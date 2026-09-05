"use client";

import Link from "next/link";
import { ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "./page-header";
import { Pill } from "@/components/primitives/pill";
import { Row } from "@/components/primitives/surfaces";

// What an owner sees right after creating a clinic. Three things before a
// booking can be taken, and the link to share.

export function FirstRun({ orgSlug, clinicName }: { orgSlug: string; clinicName: string }) {
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`${clinicName} is ready.`} lead="Three things before you take a booking." />
      <ol className="flex flex-col gap-2">
        <li>
          <Row href={`${base}/services`} title="Add your services" secondary="What can be booked, how long it takes, what it costs." trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} />
        </li>
        <li>
          <Row href={`${base}/hours`} title="Set working hours" secondary="Per vet or groomer, plus closures and leave." trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} />
        </li>
        <li>
          <Row href={`${base}/staff`} title="Invite your staff" secondary="Front desk runs the day. Vets see their column." trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} />
        </li>
        <li>
          <Row
            title="Share your booking link"
            secondary={<span className="tabular">{url}</span>}
            trailing={
              <button type="button" onClick={copy} className="grid size-10 place-items-center rounded-full hover:bg-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label="Copy booking link">
                {copied ? <Check className="size-5" strokeWidth={1.5} /> : <Copy className="size-5" strokeWidth={1.5} />}
              </button>
            }
          />
        </li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Pill asChild>
          <Link href={`${base}/services`}>Add a service</Link>
        </Pill>
        <Pill asChild variant="secondary">
          <Link href={`/app/${orgSlug}`}>Go to today</Link>
        </Pill>
      </div>
    </div>
  );
}
