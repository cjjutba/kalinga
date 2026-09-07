import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { palette } from "@/lib/design/palette";

// The card every shared link renders as. Drawn rather than generated, because
// an image model cannot set type and this has to be exactly right: it is the
// first thing anyone sees when the link lands in Messenger.
//
// Colour comes from the palette module for the same reason email does. There
// is no stylesheet here, so a token cannot be reached by name.

export const alt = "Kalinga, booking and recall for veterinary clinics in Northern Mindanao";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mark = readFileSync(join(process.cwd(), "public", "brand", "kalinga-mark.svg"), "utf8");
  const markUrl = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: palette.ground,
          color: palette.ink,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <img src={markUrl} width={64} height={64} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05, maxWidth: 900 }}>
            Your clinic&apos;s appointment book, off paper. And it remembers.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: palette.muted, maxWidth: 820 }}>
            Booking, records and recall for veterinary clinics in Northern Mindanao.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: palette.muted }}>
          <span>kalinga.cjjutba.dev</span>
          <span>Free during the pilot</span>
        </div>
      </div>
    ),
    size,
  );
}
