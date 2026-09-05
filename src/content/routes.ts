// Every route, grouped by surface, for the /design directory. Keep this in
// step with docs/design/pages.md. Staff routes take the clinic's slug; the
// directory uses the first clinic the signed in person belongs to when it can.

export interface RouteEntry {
  label: string;
  href: string;
  note?: string;
}

export interface RouteGroup {
  title: string;
  routes: RouteEntry[];
}

export function routeGroups(org = "your-clinic"): RouteGroup[] {
  return [
    {
      title: "Marketing and legal",
      routes: [
        { label: "Landing", href: "/" },
        { label: "Privacy", href: "/privacy" },
        { label: "Deletion request", href: "/privacy/request" },
        { label: "Not found", href: "/this-page-does-not-exist" },
      ],
    },
    {
      title: "Public booking",
      routes: [
        { label: "Clinic page", href: `/${org}` },
        { label: "Book", href: `/${org}/book`, note: "service, vet, slot, details, review" },
        { label: "Confirmation and manage booking", href: `/${org}/b/REFERENCE`, note: "from the confirmation message" },
      ],
    },
    {
      title: "Client portal",
      routes: [
        { label: "Sign in by magic link", href: "/me" },
        { label: "My appointments", href: "/me/appointments" },
        { label: "My pets", href: "/me/pets" },
      ],
    },
    {
      title: "Staff auth and onboarding",
      routes: [
        { label: "Sign in", href: "/sign-in" },
        { label: "Create your account", href: "/sign-up" },
        { label: "Reset password", href: "/reset" },
        { label: "Create clinic", href: "/new" },
        { label: "Choose clinic", href: "/app" },
      ],
    },
    {
      title: "Staff application",
      routes: [
        { label: "Day view", href: `/app/${org}` },
        { label: "Clients", href: `/app/${org}/clients` },
        { label: "New client", href: `/app/${org}/clients/new` },
        { label: "Pets", href: `/app/${org}/pets` },
        { label: "New pet", href: `/app/${org}/pets/new` },
        { label: "Recall queue", href: `/app/${org}/recall` },
        { label: "Reminder log", href: `/app/${org}/recall/log` },
        { label: "Settings, clinic", href: `/app/${org}/settings` },
        { label: "Settings, services", href: `/app/${org}/settings/services` },
        { label: "Settings, staff", href: `/app/${org}/settings/staff` },
        { label: "Settings, hours", href: `/app/${org}/settings/hours` },
        { label: "Settings, closures", href: `/app/${org}/settings/closures` },
        { label: "Settings, recall rules", href: `/app/${org}/settings/recall` },
        { label: "Audit trail", href: `/app/${org}/audit` },
      ],
    },
    {
      title: "Internal",
      routes: [{ label: "Design sheet", href: "/design" }],
    },
  ];
}
