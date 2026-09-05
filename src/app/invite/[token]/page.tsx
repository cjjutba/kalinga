import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "You're invited" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell photoCaption="Photograph, a cat">
      <Suspense fallback={null}>
        <InviteForm token={token} />
      </Suspense>
    </AuthShell>
  );
}
