// The booking address. It is the link a clinic paints on its door, so it is
// checked the same way wherever it is typed: the setup flow and the dialog for
// a second clinic both come through here.

export const reservedSlugs = new Set(["app", "me", "api", "design", "sign-in", "sign-up", "reset", "new", "invite", "privacy", "demo", "kalinga", "admin", "www"]);

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
