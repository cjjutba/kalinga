import { Resend } from "resend";
import { firstName } from "@/lib/domain/selectors";
import { renderEmail, renderEmailText, withoutLinkSentences, type EmailContent } from "@/lib/email-layout";

// Every message the system sends goes through here. With RESEND_API_KEY set,
// mail goes out from cjjutba.dev through Resend. Without it, nothing is sent
// and the link is written to the server log so the owner can pass it on by
// hand. There is no third path.
//
// Both parts go out on every message, HTML and plain text. A text only mail
// carrying one long link is a shape spam filters know, and this domain is new
// enough to have no reputation to spend. Replies reach a person rather than a
// no-reply address, for the same reason.

const from = process.env.EMAIL_FROM ?? "Kalinga <kalinga@cjjutba.dev>";
const replyTo = process.env.EMAIL_REPLY_TO ?? "hello@cjjutba.dev";

async function deliver(to: string, subject: string, content: EmailContent, opts?: { replyTo?: string; headers?: Record<string, string> }) {
  const url = content.action?.url ?? "";
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email not sent, no RESEND_API_KEY] to=${to} subject="${subject}" url=${url}`);
    return { sent: false as const, url };
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    replyTo: opts?.replyTo ?? replyTo,
    text: renderEmailText(content),
    html: renderEmail(content),
    // Keeps Gmail from folding separate messages into one thread.
    headers: { "X-Entity-Ref-ID": crypto.randomUUID(), ...opts?.headers },
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
  return { sent: true as const };
}

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendInvitationEmail(p: { to: string; inviter: string; inviterEmail?: string; organisation: string; role: string; url: string }) {
  const role = p.role.replace("_", " ");
  return deliver(
    p.to,
    `${p.inviter} invited you to ${p.organisation} on Kalinga`,
    {
      preheader: `${p.inviter} set you up as ${role} at ${p.organisation}.`,
      heading: `Join ${p.organisation}`,
      paragraphs: [`${p.inviter} has set you up as ${role} at ${p.organisation}, the clinic's booking and records on Kalinga.`],
      action: { label: "Accept the invitation", url: p.url },
      footnote: "The link works for seven days. If you were not expecting this, ignore it and nothing happens.",
      signature: `Sent because ${p.inviter} entered this address at ${p.organisation}.`,
    },
    // A reply reaches the person who invited them, which is who they would ask.
    { replyTo: p.inviterEmail },
  );
}

export async function sendResetPasswordEmail(p: { to: string; name: string; url: string }) {
  return deliver(p.to, "Reset your Kalinga password", {
    preheader: "Choose a new password. The link works for one hour.",
    heading: "Reset your password",
    paragraphs: [`Hi ${firstName(p.name)}, someone asked to reset the password for this account.`],
    action: { label: "Choose a new password", url: p.url },
    footnote: "The link works for one hour. If it was not you, ignore this and nothing changes.",
  });
}

/** A booking confirmation, change or cancellation, in the same words the confirmation page shows. */
export async function sendBookingEmail(p: { to: string; subject: string; text: string; manageUrl: string; clinicName?: string; actionLabel?: string }) {
  const paragraphs = withoutLinkSentences(p.text);
  return deliver(p.to, p.subject, {
    preheader: paragraphs[0] ?? p.subject,
    heading: p.subject,
    paragraphs,
    action: { label: p.actionLabel ?? "Change or cancel this booking", url: p.manageUrl },
    footnote: "Or reply to this email and the clinic will pick it up.",
    signature: p.clinicName ? `Sent by ${p.clinicName} through Kalinga.` : undefined,
  });
}

/** A recall reminder, the same text the desk would have copied. */
export async function sendReminderEmail(p: { to: string; subject: string; text: string; bookingUrl: string; clinicName?: string }) {
  const paragraphs = withoutLinkSentences(p.text);
  return deliver(
    p.to,
    p.subject,
    {
      preheader: paragraphs[0] ?? p.subject,
      heading: p.subject,
      paragraphs,
      action: { label: "Book a time", url: p.bookingUrl },
      footnote: "Or reply to this email and the clinic will fit you in.",
      signature: p.clinicName ? `Sent by ${p.clinicName} because your pet is due.` : undefined,
    },
    // A reminder is the one message someone might not want again, so it says
    // how to stop in the header every mail client reads.
    { headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=Stop%20reminders>` } },
  );
}

export async function sendMagicLinkEmail(p: { to: string; url: string }) {
  return deliver(p.to, "Your Kalinga sign in link", {
    preheader: "See your pets and appointments. The link works for one hour.",
    heading: "Your sign in link",
    paragraphs: ["Here is your link to see your pets and appointments at the clinic."],
    action: { label: "See my pets and appointments", url: p.url },
    footnote: "The link works for one hour and can be used once. If you did not ask for it, ignore this.",
  });
}
