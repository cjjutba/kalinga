"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { Resend } from "resend";
import { allowRate } from "@/lib/db/queries";

// The working route for deletion and access requests RA 10173 asks for. The
// request goes by email to the privacy inbox. Without a mail key it is written
// to the server log and the person is told to email directly, so nothing is
// silently lost and nothing pretends to be sent.

const input = z.object({
  contact: z.string().trim().min(3).max(200),
  clinic: z.string().trim().max(200).optional(),
  kind: z.enum(["delete", "copy", "correct"]),
  details: z.string().trim().max(2000).optional(),
  website: z.string().max(0),
});

export type PrivacyRequestResult = { ok: true; delivered: boolean; inbox: string } | { ok: false; error: string };

export async function submitPrivacyRequest(raw: unknown): Promise<PrivacyRequestResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await allowRate(`privacy:${ip}`, 3, 60 * 60))) return { ok: false, error: "Too many requests from this connection. Email us instead." };

  const inbox = process.env.PRIVACY_INBOX ?? "privacy@cjjutba.dev";
  const p = parsed.data;
  const kind = { delete: "Delete my data", copy: "A copy of my data", correct: "Correct my data" }[p.kind];
  const body = `Privacy request via kalinga.cjjutba.dev\n\nRequest: ${kind}\nContact: ${p.contact}\nClinic: ${p.clinic || "not given"}\nDetails: ${p.details || "none"}\nReceived: ${new Date().toISOString()}\n\nAnswer within fifteen days.`;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[privacy request, not emailed] ${body.replace(/\n/g, " | ")}`);
    return { ok: true, delivered: false, inbox };
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Kalinga <kalinga@cjjutba.dev>", to: inbox, subject: `Privacy request: ${kind}`, text: body });
  if (error) return { ok: false, error: "Could not send the request. Email us directly instead." };
  return { ok: true, delivered: true, inbox };
}
