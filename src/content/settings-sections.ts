import { Building2, CalendarOff, Clock, Repeat, Stethoscope, UserCog, type LucideIcon } from "lucide-react";

// The six things a clinic sets up. They are pages, not tabs, and this list is
// what the sidebar expands into, so the sections are named once. The icon and
// the lead ride along because the onboarding walks the same six in order and
// has to introduce each one.

export type SettingsSection = {
  segment: string;
  label: string;
  icon: LucideIcon;
  lead: string;
};

export const settingsSections: SettingsSection[] = [
  { segment: "", label: "Clinic", icon: Building2, lead: "The clinic as pet owners see it." },
  { segment: "services", label: "Services", icon: Stethoscope, lead: "What you offer, how long it takes, what it costs." },
  { segment: "staff", label: "Staff", icon: UserCog, lead: "Who works here and what they can reach." },
  { segment: "hours", label: "Hours", icon: Clock, lead: "The days and times each vet takes appointments." },
  { segment: "closures", label: "Closures", icon: CalendarOff, lead: "Holidays and the days you shut." },
  { segment: "recall", label: "Recall rules", icon: Repeat, lead: "How long until a pet is due again." },
];
