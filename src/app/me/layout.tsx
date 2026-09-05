import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { getSession } from "@/lib/session";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return <PortalShell signedIn={!!session}>{children}</PortalShell>;
}
