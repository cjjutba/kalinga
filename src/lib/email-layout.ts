import "server-only";
import { palette } from "@/lib/design/palette";

// One layout for every message Kalinga sends. Tables and inline styles,
// because email clients are not browsers: no stylesheet, no flexbox, no
// custom properties. Light only, since a dark palette that half the clients
// ignore reads worse than a light one they all render the same.
//
// The shape is the one people already trust from Vercel and GitHub: a card,
// a sentence or two, one button, and the same link in full underneath for
// anyone whose client strips the button or who wants to paste it elsewhere.
// No images, so nothing is blocked and nothing needs downloading.

export interface EmailAction {
  label: string;
  url: string;
}

export interface EmailContent {
  /** The grey line under the subject in an inbox list. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  action?: EmailAction;
  /** The quiet line under the button: how long a link lasts, what to ignore. */
  footnote?: string;
  /** Who this came from, under the card. */
  signature?: string;
}

const card = palette.surface;
const ink = palette.ink;
const muted = palette.muted;
const hairline = palette.hairline;
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// The mark, as a PNG because no mail client can be trusted with an SVG. Its
// alt text is the name, so a client that blocks images still says who sent
// this.
const origin = process.env.BETTER_AUTH_URL ?? "https://kalinga.cjjutba.dev";
const logo = `${origin}/brand/icon-192.png`;

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Sentences carrying a link, dropped. The stored message is written to be
 * pasted into Messenger, where a bare address is the only way to send someone
 * somewhere. In an email the button does that, and a raw address in the body
 * is one of the things spam filters count against a new domain.
 */
export function withoutLinkSentences(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split(/(?<=\.)\s+/)
        .filter((sentence) => !/https?:\/\/|kalinga\.cjjutba\.dev|[a-z0-9-]+\.[a-z]{2,}\//i.test(sentence))
        .join(" ")
        .trim(),
    )
    .filter(Boolean);
}

export function renderEmail(c: EmailContent): string {
  const paragraphs = c.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${ink}">${escape(p)}</p>`)
    .join("");

  const button = c.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0"><tr><td style="border-radius:999px;background:${ink}">
         <a href="${escape(c.action.url)}" style="display:inline-block;padding:13px 24px;font-family:${font};font-size:15px;font-weight:500;line-height:1;color:${palette.onInk};text-decoration:none;border-radius:999px">${escape(c.action.label)}</a>
       </td></tr></table>`
    : "";

  const fallback = c.action
    ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:${muted}">Or paste this into your browser:<br>
         <a href="${escape(c.action.url)}" style="color:${muted};text-decoration:underline;word-break:break-all">${escape(c.action.url)}</a></p>`
    : "";

  const footnote = c.footnote ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${muted}">${escape(c.footnote)}</p>` : "";
  const signature = c.signature ? `<p style="margin:0 0 6px">${escape(c.signature)}</p>` : "";

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(c.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${card};font-family:${font};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escape(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${card}">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px">
      <tr><td style="padding:0 0 18px">
        <img src="${logo}" width="40" height="40" alt="Kalinga" style="display:block;border:0;outline:none;text-decoration:none;border-radius:9px">
      </td></tr>
      <tr><td style="background:${card};border:1px solid ${hairline};border-radius:14px;padding:28px">
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;font-weight:600;color:${ink}">${escape(c.heading)}</h1>
        ${paragraphs}
        ${button}
        ${fallback}
        ${footnote}
      </td></tr>
      <tr><td style="padding:16px 2px 0;font-size:12px;line-height:1.5;color:${muted}">
        ${signature}
        <p style="margin:0">Kalinga is booking, records and recall for veterinary clinics in the Philippines.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** The same message as plain text, for clients that will not render HTML. */
export function renderEmailText(c: EmailContent): string {
  const parts = [c.heading, "", ...c.paragraphs];
  if (c.action) parts.push("", `${c.action.label}:`, c.action.url);
  if (c.footnote) parts.push("", c.footnote);
  parts.push("", c.signature ?? "Kalinga");
  return parts.join("\n");
}
