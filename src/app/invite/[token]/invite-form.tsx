"use client";

import { placeholder } from "@/content/placeholders";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { GuideCard, Row } from "@/components/primitives/surfaces";
import { authClient } from "@/lib/auth-client";
import { roleDescription, roleLabel } from "@/lib/roles";
import { initials } from "@/lib/domain/selectors";
import type { getInvitationPublic } from "@/lib/db/queries";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationPublic>>>;

// Accepting an invitation. Someone new creates their account with the invited
// email and joins in one step. Someone already signed in with that email
// joins with one click. A different signed in email is told so, plainly.

export function InviteForm({ invitation, signedInAs }: { invitation: Invitation | null; signedInAs: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  if (!invitation || invitation.status !== "pending" || invitation.expired) {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead={invitation ? `Ask ${invitation.inviter} to send a new one.` : "Check the link you were sent, or ask the clinic to invite you again."}>{invitation ? "This invitation has expired" : "That invitation is not on file"}</AuthTitle>
        <Pill asChild block variant="secondary">
          <Link href="/sign-in">Back to sign in</Link>
        </Pill>
        <PrivacyFooter />
      </div>
    );
  }

  const role = invitation.role;
  const sameAccount = signedInAs?.toLowerCase() === invitation.email.toLowerCase();

  async function accept() {
    const { error } = await authClient.organization.acceptInvitation({ invitationId: invitation!.id });
    if (error) {
      setErrors({ form: error.message ?? "Could not accept the invitation." });
      setLoading(false);
      return;
    }
    router.push(`/app/${invitation!.slug}`);
    router.refresh();
  }

  async function join() {
    setLoading(true);
    await accept();
  }

  async function signUpAndJoin(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Tell us your name so the clinic knows who booked what.";
    if (password.length < 10) next.password = "Use at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const { error } = await authClient.signUp.email({ name: name.trim(), email: invitation!.email, password });
    if (error) {
      setLoading(false);
      setErrors({ form: error.message?.includes("exist") ? "That email already has an account. Sign in first, then open this link again." : error.message ?? "Could not create the account." });
      return;
    }
    await accept();
  }

  return (
    <form onSubmit={signUpAndJoin} noValidate className="flex flex-col gap-5">
      <AuthTitle>Join {invitation.clinic}</AuthTitle>
      <GuideCard tone="auto" name={invitation.inviter} initials={initials(invitation.inviter)}>
        I&apos;ve set you up as {roleLabel[role].toLowerCase()}. {roleDescription[role]}
      </GuideCard>
      {errors.form ? (
        <p role="alert" className="text-small text-error">
          {errors.form}
        </p>
      ) : null}

      {signedInAs && sameAccount ? (
        <>
          <Row tone="auto" title={`Signed in as ${signedInAs}`} trailing={<span className="grid size-8 place-items-center rounded-full bg-sheet text-label font-medium lg:bg-field">{signedInAs[0]?.toUpperCase()}</span>} />
          <Pill type="button" block loading={loading} loadingLabel="Joining" onClick={join}>
            Join
          </Pill>
        </>
      ) : signedInAs ? (
        <>
          <p className="text-small text-text-2">
            This invitation is for <span className="font-medium text-text">{invitation.email}</span> and you are signed in as {signedInAs}. Sign out, then open the link again.
          </p>
          <Pill
            type="button"
            block
            variant="secondary"
            onClick={async () => {
              await authClient.signOut();
              router.refresh();
            }}
          >
            Sign out
          </Pill>
        </>
      ) : (
        <>
          <p className="text-small text-text-2">
            Your account will use <span className="font-medium text-text">{invitation.email}</span>.
          </p>
          <InputField on="auth" label="Your name" name="name" autoComplete="name" placeholder={placeholder.personName} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} disabled={loading} />
          <InputField on="auth" label="Choose a password" name="password" type="password" autoComplete="new-password" placeholder={placeholder.newPassword} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={loading} />
          <Pill type="submit" block loading={loading} loadingLabel="Joining">
            Join clinic
          </Pill>
          <p className="text-center">
            <Link href={`/sign-in?next=/invite/${invitation.id}`} className="text-small font-medium text-text hover:underline">
              Already have an account? Sign in
            </Link>
          </p>
        </>
      )}
      <PrivacyFooter />
    </form>
  );
}
