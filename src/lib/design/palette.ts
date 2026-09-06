// The only place in the product where a colour is written as a value.
//
// Everything on screen reads its colour from the tokens in globals.css. These
// are for the two places a CSS variable cannot reach: the browser chrome,
// which is metadata read before any stylesheet, and email, which is rendered
// by clients that have no stylesheet at all. Keep them in step with the light
// column of the table in DESIGN.md.

export const palette = {
  page: "#ffffff",
  pageDark: "#0a0a0a",
  sheet: "#f5f5f7",
  ink: "#0a0a0a",
  muted: "#656569",
  hairline: "#e4e4e9",
  onInk: "#ffffff",
} as const;

/** The colour the browser paints its own chrome with, per scheme. */
export const chrome = { light: palette.page, dark: palette.pageDark } as const;
