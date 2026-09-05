import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";

export const metadata: Metadata = { title: "Book an appointment" };

export default async function Page({ params }: { params: Promise<{ clinic: string }> }) {
  const { clinic } = await params;
  return (
    <Suspense fallback={null}>
      <BookingFlow slug={clinic} />
    </Suspense>
  );
}
