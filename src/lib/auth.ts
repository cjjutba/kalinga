import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink, organization } from "better-auth/plugins";
import { ac, roles } from "./access";
import { db } from "./db/client";
import * as schema from "./db/schema";
import { sendInvitationEmail, sendMagicLinkEmail, sendResetPasswordEmail } from "./email";

// Identity and membership. Better Auth answers who you are and which clinics
// you belong to. What you may touch is decided in roles.ts on top of the role
// stored on the membership, checked on the server in every action. Pet owners
// are never members; they sign in with a magic link and hold no role.

export const auth = betterAuth({
  appName: "Kalinga",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, name: user.name, url });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [
    organization({
      ac,
      roles,
      creatorRole: "owner",
      // Opening a clinic is an owner's act. Someone who works the desk at
      // another clinic does not get to create one from inside it, and an
      // account with no clinic yet has to be able to make its first.
      allowUserToCreateOrganization: async (user) => {
        const rows = await db.select({ role: schema.member.role }).from(schema.member).where(eq(schema.member.userId, user.id));
        return rows.length === 0 || rows.some((r) => r.role === "owner");
      },
      organizationLimit: 5,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      sendInvitationEmail: async (data) => {
        await sendInvitationEmail({
          to: data.email,
          inviter: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          organisation: data.organization.name,
          role: data.role,
          url: `${process.env.BETTER_AUTH_URL}/invite/${data.id}`,
        });
      },
      schema: {
        organization: {
          additionalFields: {
            timezone: { type: "string", required: false, defaultValue: "Asia/Manila", input: true },
            address: { type: "string", required: false, input: true },
            city: { type: "string", required: false, input: true },
            mobile: { type: "string", required: false, input: true },
            email: { type: "string", required: false, input: true },
            openFrom: { type: "string", required: false, defaultValue: "09:00", input: true },
            openTo: { type: "string", required: false, defaultValue: "18:00", input: true },
            groomingIntervalWeeks: { type: "number", required: false, defaultValue: 5, input: true },
          },
        },
      },
    }),
    magicLink({
      expiresIn: 60 * 60,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ to: email, url });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
