// The six things a clinic sets up. They are pages, not tabs, and this list is
// what the sidebar expands into so the sections are named in one place.

export const settingsSections = [
  { segment: "", label: "Clinic" },
  { segment: "services", label: "Services" },
  { segment: "staff", label: "Staff" },
  { segment: "hours", label: "Hours" },
  { segment: "closures", label: "Closures" },
  { segment: "recall", label: "Recall rules" },
] as const;
