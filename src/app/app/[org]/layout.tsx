import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff/shell";

export default async function OrgLayout({ children, params }: { children: ReactNode; params: Promise<{ org: string }> }) {
  const { org } = await params;
  return <StaffShell orgSlug={org}>{children}</StaffShell>;
}
