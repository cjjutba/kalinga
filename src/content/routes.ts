// Every route in docs/design/pages.md, grouped by surface, for the /design
// directory and the sandbox. Keep this in step with pages.md. A route missing
// from here is a route nobody walks during a check.

export interface RouteEntry {
  label: string;
  href: string;
  note?: string;
}

export interface RouteGroup {
  title: string;
  routes: RouteEntry[];
}

const org = "lunhaw";
const clinic = "lunhaw";

export const routeGroups: RouteGroup[] = [
  {
    title: "Marketing and legal",
    routes: [
      { label: "Landing", href: "/" },
      { label: "Privacy", href: "/privacy" },
      { label: "Deletion request", href: "/privacy/request" },
      { label: "Demo entry", href: "/demo" },
      { label: "Sandbox expired", href: "/demo/expired" },
      { label: "Not found", href: "/this-page-does-not-exist" },
    ],
  },
  {
    title: "Public booking",
    routes: [
      { label: "Clinic page", href: `/${clinic}` },
      { label: "Book", href: `/${clinic}/book`, note: "service, vet, slot, details, review" },
      { label: "Book, every slot taken", href: `/${clinic}/book?state=full` },
      { label: "Book, next three days empty", href: `/${clinic}/book?state=empty` },
      { label: "Book, slot taken while typing", href: `/${clinic}/book?state=race` },
      { label: "Book, rate limited", href: `/${clinic}/book?state=limited` },
      { label: "Book, cold start", href: `/${clinic}/book?state=loading` },
      { label: "Confirmation and manage booking", href: `/${clinic}/b/KLG-DEMO` },
    ],
  },
  {
    title: "Client portal",
    routes: [
      { label: "Sign in", href: "/me" },
      { label: "My appointments", href: "/me/appointments" },
      { label: "Appointment detail", href: "/me/appointments/first" },
      { label: "My pets", href: "/me/pets" },
      { label: "Pet detail", href: "/me/pets/first" },
    ],
  },
  {
    title: "Staff auth and onboarding",
    routes: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Sign in, error", href: "/sign-in?state=error" },
      { label: "Sign in, loading", href: "/sign-in?state=loading" },
      { label: "Accept invitation", href: "/invite/demo-token" },
      { label: "Accept invitation, signed in", href: "/invite/demo-token?state=signed-in" },
      { label: "Accept invitation, expired", href: "/invite/demo-token?state=expired" },
      { label: "Reset password", href: "/reset" },
      { label: "Reset, sent", href: "/reset?state=sent" },
      { label: "Reset, sandbox link", href: "/reset?state=sandbox" },
      { label: "Reset, new password", href: "/reset?state=new" },
      { label: "Reset, expired", href: "/reset?state=expired" },
      { label: "Create clinic", href: "/new" },
      { label: "Create clinic, slug taken", href: "/new?state=taken" },
      { label: "Choose clinic", href: "/app" },
      { label: "Choose clinic, empty", href: "/app?state=empty" },
      { label: "Choose clinic, loading", href: "/app?state=loading" },
    ],
  },
  {
    title: "Staff application",
    routes: [
      { label: "Day view", href: `/app/${org}` },
      { label: "Day view, empty", href: `/app/${org}?state=empty` },
      { label: "Day view, loading", href: `/app/${org}?state=loading` },
      { label: "First run", href: `/app/${org}?state=first-run` },
      { label: "Clients", href: `/app/${org}/clients` },
      { label: "Client detail", href: `/app/${org}/clients/first` },
      { label: "New client", href: `/app/${org}/clients/new` },
      { label: "Pets", href: `/app/${org}/pets` },
      { label: "Pet record", href: `/app/${org}/pets/first` },
      { label: "New pet", href: `/app/${org}/pets/new` },
      { label: "Add visit", href: `/app/${org}/pets/first/visit` },
      { label: "Recall queue", href: `/app/${org}/recall` },
      { label: "Reminder log", href: `/app/${org}/recall/log` },
      { label: "Settings, clinic", href: `/app/${org}/settings` },
      { label: "Settings, services", href: `/app/${org}/settings/services` },
      { label: "Settings, staff", href: `/app/${org}/settings/staff` },
      { label: "Settings, hours", href: `/app/${org}/settings/hours` },
      { label: "Settings, closures", href: `/app/${org}/settings/closures` },
      { label: "Settings, recall rules", href: `/app/${org}/settings/recall` },
      { label: "Audit trail", href: `/app/${org}/audit` },
      { label: "Audit event", href: `/app/${org}/audit/first` },
    ],
  },
  {
    title: "Internal",
    routes: [{ label: "Design sheet", href: "/design" }],
  },
];
