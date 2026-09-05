import { StatusPill } from "@/components/primitives/status-pill";

// The one floating product card, marketing only, on the laptop photo panel.
// Pale tint, tilted three degrees, and the only shadow in the interface
// because it sits on a photograph rather than a surface.

export function NextAppointmentCard() {
  return (
    <div className="rotate-3 rounded-card bg-tint p-5 shadow-[0_12px_32px_rgba(0,0,0,0.08)]" aria-hidden>
      <p className="text-label font-medium text-text-2">Next appointment</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-text-2 text-label text-sheet/80">K</span>
        <p className="text-body text-text">Kiko, 9:30 AM, Vaccination</p>
      </div>
      <StatusPill status="confirmed" className="mt-3 bg-sheet" />
    </div>
  );
}
