import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingConfirmation } from "@/components/booking/confirmation";

export const metadata: Metadata = { title: "Your booking" };

export default async function Page({ params }: { params: Promise<{ clinic: string; ref: string }> }) {
  const { clinic, ref } = await params;
  return (
    <Suspense fallback={null}>
      <BookingConfirmation slug={clinic} reference={ref} />
    </Suspense>
  );
}
