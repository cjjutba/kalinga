import { Resend } from "resend";

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
    `Hi ${p.name.split(" ")[0]},\n\nSomeone asked to reset the password for this account. If that was you, use this link within the hour:\n${p.url}\n\nIf it was not you, ignore this and nothing changes.\n\nKalinga`,
    p.url,
  );
}

export async function sendMagicLinkEmail(p: { to: string; url: string }) {
  return deliver(
    p.to,
    "Your Kalinga sign in link",
    `Hi,\n\nHere is your link to see your pets and appointments. It works for one hour:\n${p.url}\n\nKalinga`,
    p.url,
  );
}
