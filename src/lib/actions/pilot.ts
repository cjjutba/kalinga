"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { Resend } from "resend";
import { allowRate } from "@/lib/db/queries";

// The pilot enquiry from the landing page. It goes to the same inbox the
// privacy route uses, on the same terms: rate limited by address, a honeypot
// field, and with no mail key it is written to the server log and the person is
// told to email directly. A button that pretends to send is worse than no
// button, which is what the old mailto to an address nobody reads amounted to.

const input = z.object({
  name: z.string().trim().min(2).max(120),
  clinic: z.string().trim().min(2).max(160),
  city: z.string().trim().max(120).optional(),
  contact: z.string().trim().min(5).max(200),
  website: z.string().max(0),
});

export type PilotRequestResult = { ok: true; delivered: boolean; inbox: string } | { ok: false; error: string };

export async function submitPilotRequest(raw: unknown): Promise<PilotRequestResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await allowRate(`pilot:${ip}`, 3, 60 * 60))) return { ok: false, error: "Too many enquiries from this connection. Email us instead." };

  const inbox = process.env.PILOT_INBOX ?? process.env.PRIVACY_INBOX ?? "hello@cjjutba.dev";
  const p = parsed.data;
  const body = `Pilot enquiry via kalinga.cjjutba.dev\n\nName: ${p.name}\nClinic: ${p.clinic}\nCity: ${p.city || "not given"}\nContact: ${p.contact}\nReceived: ${new Date().toISOString()}`;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[pilot enquiry, not emailed] ${body.replace(/\n/g, " | ")}`);
    return { ok: true, delivered: false, inbox };
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Kalinga <kalinga@cjjutba.dev>",
    to: inbox,
    replyTo: p.contact.includes("@") ? p.contact : undefined,
    subject: `Pilot enquiry: ${p.clinic}`,
    text: body,
  });
  if (error) return { ok: false, error: "Could not send it. Email us directly instead." };
  return { ok: true, delivered: true, inbox };
}
