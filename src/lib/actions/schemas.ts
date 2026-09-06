import { z } from "zod";

// Input shapes for the unauthenticated booking path. Kept apart from the
// server action module so they can be unit tested, and because a "use server"
// file may only export async functions.

export const bookingInput = z.object({
  orgSlug: z.string().min(1),
  serviceId: z.string().min(1),
  providerId: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  name: z.string().trim().min(1).max(200),
  /** Philippine mobile as typed: 11 digits, spaces allowed. */
  mobile: z.string().trim().regex(/^\d[\d\s]{9,12}$/),
  email: z.string().trim().email().max(200).or(z.literal("")).optional(),
  petName: z.string().trim().min(1).max(100),
  species: z.enum(["dog", "cat"]),
  notes: z.string().trim().max(2000).optional(),
  /** Honeypot. Real people never see it and never fill it. */
  website: z.string().max(0),
});

export type BookingInput = z.infer<typeof bookingInput>;

export const manageInput = z.object({ orgSlug: z.string().min(1), reference: z.string().min(4).max(16) });
