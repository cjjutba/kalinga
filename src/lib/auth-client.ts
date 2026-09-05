"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient, organizationClient } from "better-auth/client/plugins";
import { ac, roles } from "./access";

// The browser side of Better Auth. Sign in, sign up, invitations, magic
// links and organisation switching all go through here.

export const authClient = createAuthClient({
  plugins: [organizationClient({ ac, roles }), magicLinkClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
