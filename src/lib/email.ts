import { Resend } from "resend";
import { firstName } from "@/lib/domain/selectors";

// Every message the system sends goes through here. With RESEND_API_KEY set,
// mail goes out from cjjutba.dev through Resend. Without it, nothing is sent
// and the link is written to the server log so the owner can pass it on by
// hand. There is no third path.

const from = process.env.EMAIL_FROM ?? "Kalinga <kalinga@cjjutba.dev>";

async function deliver(to: string, subject: string, text: string, url: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email not sent, no RESEND_API_KEY] to=${to} subject="${subject}" url=${url}`);
    return { sent: false as const, url };
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) throw new Error(`Resend failed: ${error.message}`);
  return { sent: true as const };
}

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendInvitationEmail(p: { to: string; inviter: string; organisation: string; role: string; url: string }) {
  const role = p.role.replace("_", " ");
  return deliver(
    p.to,
    `${p.inviter} invited you to ${p.organisation} on Kalinga`,
    `Hi,\n\n${p.inviter} has set you up as ${role} at ${p.organisation}.\n\nAccept the invitation here, it works for seven days:\n${p.url}\n\nKalinga`,
    p.url,
  );
}

export async function sendResetPasswordEmail(p: { to: string; name: string; url: string }) {
  return deliver(
    p.to,
    "Reset your Kalinga password",
    `Hi ${firstName(p.name)},\n\nSomeone asked to reset the password for this account. If that was you, use this link within the hour:\n${p.url}\n\nIf it was not you, ignore this and nothing changes.\n\nKalinga`,
    p.url,
  );
}

/** A booking confirmation, change or cancellation, in the same words the confirmation page shows. */
export async function sendBookingEmail(p: { to: string; subject: string; text: string; manageUrl: string }) {
  return deliver(p.to, p.subject, `${p.text}\n\nKalinga, on behalf of the clinic`, p.manageUrl);
}

/** A recall reminder, the same text the desk would have copied. */
export async function sendReminderEmail(p: { to: string; subject: string; text: string; bookingUrl: string }) {
  return deliver(p.to, p.subject, `${p.text}\n\nKalinga, on behalf of the clinic`, p.bookingUrl);
}

export async function sendMagicLinkEmail(p: { to: string; url: string }) {
  return deliver(
    p.to,
    "Your Kalinga sign in link",
    `Hi,\n\nHere is your link to see your pets and appointments. It works for one hour:\n${p.url}\n\nKalinga`,
    p.url,
  );
}
