// The tone system, in one place.
//
// Every background in the product is one of three steps: the ground the window
// paints, a panel raised off it, and a control inside that panel. Components
// name the relationship they are in, never the colour, so changing the palette
// is a change to globals.css and nothing else. DESIGN.md holds the values.
//
// The ground is grey and a panel is white. That direction matters here: a
// control has to step away from whatever is behind it, and on a white panel
// that means going down a shade while on the grey ground it means going up to
// white. Naming the relationship is what lets the whole product turn over by
// editing two lines.
//
// Two of the four cases are responsive, because two layouts change shape at
// the laptop breakpoint. The booking flow has no panel on a phone and one from
// there up. The auth pages are the mirror: a sheet on a phone, the bare page
// from there up.

export const ground = {
  /** The window itself. Grey in light mode, near black in dark. */
  page: "bg-page",
  /** A card, dialog, sheet or panel lifted off the page. White in light mode. */
  panel: "bg-sheet",
} as const;

export type Ground = keyof typeof ground;

/** What a control sits on. */
export type On = "page" | "panel" | "shell" | "auth";

/** A control is always one step in from the ground under it, and never bordered. */
export const controlOn: Record<On, string> = {
  page: "bg-sheet",
  panel: "bg-field",
  // A stepped flow keeps the ground tone at every width: the step sits on the
  // window below the laptop breakpoint and in a panel cut back to that same
  // tone above it, so the control is white either way.
  shell: "bg-sheet",
  auth: "bg-field lg:bg-sheet",
};

/**
 * What the focus ring's gap is drawn over. It has to match the ground under
 * the control or the ring gets a halo in the wrong tone.
 */
export const ringOffsetOn: Record<On, string> = {
  page: "ring-offset-page",
  panel: "ring-offset-sheet",
  // The booking panel is cut back to the window's tone, so it is the same
  // either side of the breakpoint.
  shell: "ring-offset-page",
  auth: "ring-offset-sheet lg:ring-offset-page",
};

/**
 * The three layers of a stepped flow, named where they are used. The window,
 * the frame that appears around the rail and the step from the laptop
 * breakpoint up, and the step itself cut back to the window's tone with a
 * hairline round it. The frame is the raised white one, so the step reads as
 * cut out of it rather than laid on it. Below that breakpoint there is no
 * frame and no panel: the step sits on the window, which is why its controls
 * take the "shell" tone.
 */
export const steppedFlow = {
  window: "bg-page",
  frame: "lg:bg-sheet",
  panel: "lg:bg-page lg:border lg:border-divider",
} as const;
