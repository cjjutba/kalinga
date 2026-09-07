import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { getInvitationPublic } from "@/lib/db/queries";
import { getSession } from "@/lib/session";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "You're invited" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invitation, session] = await Promise.all([getInvitationPublic(token), getSession()]);
  return (
    <AuthShell photo="puspin">
      <Suspense fallback={null}>
        <InviteForm invitation={invitation} signedInAs={session?.user.email ?? null} />
      </Suspense>
    </AuthShell>
  );
}
