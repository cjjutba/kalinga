# Design system

Kalinga is a product, not a portfolio. That difference decides most of what
follows.

This is the second version of this file. The first was written before any
screen existed and proposed a warm earth tone accent with hairline borders.
The design step on 2026-09-05 tested that against generated boards and it
lost. What replaced it is recorded here as numbers, and the reasoning is in
`docs/design/direction.md` and `docs/product/decisions.md`. The reference
board is `docs/design/explorations/boards/2026-09-05-staff-sign-in-gpt-image-2.png`.

## The direction in one paragraph

Near white and near black. A soft grey page, white sheets and cards, no
borders and no shadows, so surfaces are told apart by tone alone. Pill
buttons, a near black primary. One pale blue tint reserved for featured
content. All the warmth comes from photography of animals and from the mark,
never from an accent hue. The reference points are Future, Oura and Linear.

## What it inherits, and what it does not

It takes the **architecture** of the design system on cjjutba.dev. Semantic
tokens over raw values, hierarchy from weight and colour rather than size, a
small fixed type scale, and dark mode as a token remap. Those choices survive
because one person can maintain them.

It does not take hairlines. The portfolio separates regions with one pixel
lines. Kalinga separates them with tone, because a form made of hairline boxes
reads as a settings page and a clinic owner deciding whether to pay should not
be looking at a settings page.

The first draft of this file said the interface could not be monochrome. It
can, once photography carries the warmth and status keeps its own small
palette. What it cannot be is grey on grey with nothing alive in it.

## Colour

Tokens are CSS variables. Never use a hex value in a component. Dark mode is
the same tokens with the second column of values.

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `--page` | Page background | `#FFFFFF` | `#0A0A0A` |
| `--sheet` | Sheets, cards, inputs on the page | `#F5F5F7` | `#161618` |
| `--field` | Inputs and guide cards on a sheet | `#EBEBEE` | `#1F1F22` |
| `--text` | Primary text, icons, links | `#0A0A0A` | `#F5F5F7` |
| `--text-2` | Secondary text | `#656569` | `#9A9AA1` |
| `--text-3` | Placeholder only, never content | `#A0A0A6` | `#6B6B70` |
| `--divider` | Rare. Table rows in dense views | `#E4E4E9` | `#26262A` |
| `--action` | Primary pill background | `#0A0A0A` | `#F5F5F7` |
| `--on-action` | Text on the primary pill | `#FFFFFF` | `#0A0A0A` |
| `--action-pressed` | Primary pill pressed | `#262626` | `#D9D9DE` |
| `--pill-2` | Secondary pill background | `#EBEBEE` | `#26262A` |
| `--tint` | Featured content cards only | `#D9E5F5` | `#1B2A40` |
| `--error` | Field ring and helper text only | `#C4281C` | `#F97066` |
| `--focus` | Focus ring | `#0A0A0A` | `#F5F5F7` |
| `--photo` | The photograph placeholder only, until real photographs land | `#55555B` | `#3A3A40` |

Rules that follow from the table.

- The ground is white in light mode and everything raised off it is a step of grey, not the other way round. `--page` is the ground, `--sheet` is what sits on it, `--field` is what sits on that.
- An input is always one step of tone away from what it sits on. On a sheet it is `--field`. On the page it is `--sheet`. It never has a border.
- **No component writes a colour.** `src/lib/design/surfaces.ts` holds the four cases a control can be in, two of them responsive, and every component names its case instead of its colour. `src/design.test.ts` fails the build if a colour value appears anywhere but `globals.css` and `src/lib/design/palette.ts`, which exists for the browser chrome and email, the two places a CSS variable cannot reach.
- One shadow, `shadow-lifted`, and only for something that floats over the page: a dialog, a menu, a toast. Nothing that sits on the page has one.
- Layout constants more than one component needs are tokens too: the booking group's cap, its rail, its panel height and its content column are `--container-booking`, `--spacing-rail`, `--spacing-panel` and `--container-step`.
- Text links are `--text` at medium weight. No underline at rest, no blue.
- `--tint` is for cards that show featured content, such as the next appointment. It never colours a button, a status or text.
- `--error` never fills a banner. A red ring on the field and one line of helper text is the whole treatment.
- Photographs are the only saturated thing on any screen.

## Status

Six appointment statuses and one recall state. Each has a background, a text
colour and a cue that is not colour, because a receptionist who cannot tell
cancelled from confirmed will double book.

| Status | Light | Dark | Cue beyond colour |
| --- | --- | --- | --- |
| Booked | `--pill-2` on `--text` | same tokens | Label |
| Confirmed | `--tint` on `--text` | same tokens | Label |
| Arrived | `--action` on `--on-action` | same tokens | Label, the only filled dark pill in a row |
| Completed | `--pill-2` on `--text-2` | same tokens | Label with a check icon |
| Cancelled | `--pill-2` on `--text-2` | same tokens | Label struck through |
| No-show | `#FDE8E6` on `#B42318` | `#3A1512` on `#F97066` | Label |
| Overdue | `#FDF1D6` on `#8A5A00` | `#3A2A0A` on `#F5C36B` | Label, used only in recall |

The no-show and overdue values are the only colours in the system outside the
token table, and they exist because the day view and the recall queue need
them. Nothing else gets a colour of its own.

## Shape and surface

| Element | Radius |
| --- | --- |
| Sheet | 24 px |
| Card | 20 px |
| Guide card | 16 px |
| Input | 14 px |
| Small tag | 8 px |
| Button, status pill | Full |

No borders on cards, sheets or inputs. No shadows anywhere in the interface.
The one exception is the floating product card used on photo panels, which
carries `0 12px 32px rgba(0,0,0,0.08)` because it sits on a photograph rather
than on a surface.

Focus is a 2 px ring in `--focus` with a 2 px offset, on every interactive
element, always visible on keyboard focus.

## Type

Inter, self hosted through `next/font` so nothing is fetched from Google at
runtime. One family, three weights.

| Size | Line height | Use |
| --- | --- | --- |
| 28 px | 1.2 | Page title, medium weight |
| 20 px | 1.25 | Card title, medium weight |
| 17 px | 1.4 | Body, inputs, buttons |
| 15 px | 1.4 | Secondary text, guide card body |
| 13 px | 1.3 | Field labels, tags, helper text |

Weights are 400 for body, 500 for anything that needs to lead, and 700 for the
wordmark and nothing else. Sentence case everywhere. No letterspaced caps, no
display face, no italics.

In code the five sizes are the utilities `text-label`, `text-small`,
`text-body`, `text-heading` and `text-title`. They are named so they cannot
collide with a colour. "Secondary" and "card" are shadcn colour names, which
is why the 15 px and 20 px steps are not called that.

Names wrap. A Filipino name that needs two lines gets two lines. Never
truncate a person's or a pet's name with an ellipsis. Numbers in the day view
and the recall queue use tabular figures.

## Spacing and layout

Four pixel base. The steps are 4, 8, 12, 16, 24, 32, 48 and 64. Nothing in
between.

Phone controls are 52 px pills and 48 px inputs, with 20 px gutters and a
minimum 44 px touch target. The tablet form sheet is 480 px wide. The laptop
form column is 400 px wide. The staff application runs at up to 1200 px of
content beside a 240 px sidebar.

**Auth pages** follow the layout the reference board settled.

- Phone: the top 40 percent is the photograph with the white lockup at top left. A white sheet with 24 px top corners rises over it and holds the form. When a field takes focus and the keyboard opens, the photograph collapses to a 64 px band so the form fits without scrolling.
- Tablet portrait: the photograph fills the top third. A 480 px sheet overlaps its bottom edge by 24 px, centred on the page.
- Laptop: the left half is the photograph with one floating product card and one line of white text at the bottom left. The right half is the page with the lockup at top left and the form column vertically centred.

## Photography

Photography is the warmth of the system, so where it appears is a rule rather
than a choice.

**Where it appears.** Staff sign in, invitation, password reset, create clinic
and choose clinic. The demo entry page. The landing page. The header of a
clinic's public booking page.

**Where it never appears.** Inside the staff application. The day view, the
records, the recall queue and the settings are used all day at a counter, and
a photograph there is decoration that slows someone down.

**Subject rules.** One animal, head and shoulders, looking just past the lens,
soft daylight from one side, plain wall, shallow depth of field, matte and
slightly desaturated. No people, no clinic, no steel table, no scrubs, no leash,
no props, no sick or injured animals, no stock smile at the camera. Aspin and
puspin first, because this is a Philippine product. One photograph per flow,
so a sign in and its error state share the same image.

**Source.** Demo photographs are generated through fal.ai and carry no third
party rights. A paying clinic replaces them with its own. Never use a stock
photograph pulled from the web. Every photograph carries descriptive alt text.

**Until they land.** The `Photo` primitive holds every spot a photograph will
occupy, as a block of `--photo` with a quiet caption naming the subject. It is
sized by the layout, so swapping in the real image moves nothing.

There is no illustration and no 3D anywhere. Icons are Lucide, 1.5 px stroke,
in `--text`, and there are as few of them as possible.

## The mark

A smile. A thick arc with round caps sweeping from 168 degrees to 28 degrees
of a circle, a small dot floating above its left end and a larger dot resting
above its right end. The larger dot is the thing being held, which is what
kalinga means. The mark was chosen from generated candidates on 2026-09-05
and rebuilt as geometry so it scales.

Files live in `public/brand/`.

| File | Use |
| --- | --- |
| `kalinga-mark.svg` | The mark in `#0A0A0A`, for light surfaces |
| `kalinga-mark-white.svg` | The mark in `#F5F5F7`, for photographs and dark surfaces |
| `kalinga-lockup.svg`, `kalinga-lockup-white.svg` | Mark and wordmark together |
| `favicon.svg` | Square, follows the operating system theme |
| `app-icon.svg` | The white mark at 62 percent on a `#0A0A0A` square with a 22 percent corner radius |

The geometry, with R as the arc's centreline radius: stroke 0.29 R, small dot
radius 0.28 R centred at (-0.83 R, -0.44 R), large dot radius 0.40 R centred
at (0.65 R, -0.19 R). The SVG is the source of truth. Do not redraw it.

**Lockup.** The wordmark is "Kalinga" in Inter Bold with -2 percent tracking.
The mark is 1.6 times the cap height, sits half a cap height to the left of
the K, and its bottom aligns with the descender line. In the product the
lockup is a component that renders the SVG beside live text, so it always
matches the interface font.

**Rules.** The mark is `--text` on light surfaces and `#F5F5F7` on photographs
and dark surfaces. It is never coloured, never tinted, never outlined, never
rotated, never given a third dot. Clear space on every side equals the large
dot's diameter. Minimum size in the interface is 24 px tall. Below that use
`favicon.svg`, which is the same mark on a square canvas.

## Components

A primitive exists when a pattern appears three times, and it lives in
`src/components/primitives/` with the reasoning in its file header. The
reference board already implies these, so they are expected rather than
speculative.

Pill, in primary, secondary and text variants. Field, which owns the label,
the input, the helper line and the error state together. Sheet. Card. Guide
card, the note from a colleague used on onboarding steps. Status pill. Mark
and Lockup. Skeleton, for the Neon cold start. Data table, the list surface for
records. The floating product card is marketing only and does not belong in
primitives.

**No native select anywhere.** The operating system draws its own control and
it cannot take the tokens, so a dropdown built on a listbox primitive stands in
for it: the trigger is an input in every respect, the same height, tone,
corners and focus ring, and the panel is a sheet with a check against the
current choice. It is one component, `SelectField`, so there is nothing to keep
in step.

**Records go in a table, not a stack of cards.** One row per thing, columns
that line up, hairlines inside a single card doing the separating, and the
whole row is one link. Columns that do not fit a phone are dropped, and the
first column carries what they said on a second line. A timeline, such as the
audit trail, stays a list, because its grouping by day matters more than its
columns.

**One toast, bottom right, no button on it.** Anything that happens away from
the eye says so there: a saved appointment, a reminder emailed, a refusal from
the server. Success reads in the ink colour, a refusal in the error colour with
its reason underneath, and both take themselves away, an error more slowly
because it is read twice. Nothing important is only in a toast, so there is
nothing to dismiss. A field that can say why beside itself still does.

**Removing anything asks first.** One dialog, one shape, everywhere: what is
being removed in the title, what actually happens underneath, a grey button
that keeps it and a red one that does it. It says the consequence rather than
warning that the act cannot be undone, because most of these can be undone and
the ones that cannot say so in their own words.

**A flow with steps carries them on a rail, and the rail is the page.** The
steps stand on the ground itself with no panel behind them, and from the laptop
breakpoint up the step being answered is a panel beside them: a hairline, the
sheet tone, its own height, and the content centred inside a 28rem column.
Below that width there is no panel at all, so the step sits on the page and the
controls step up one tone to compensate. That is what the "shell" surface in
Field means, and it is the mirror of the "auto" surface the auth pages use. On a laptop the steps stand down
the left with their state on them, done, current and not yet, and any step
already passed can be clicked to return to it. Below that width the rail lies
down as segments across the top and behaves the same. The buttons belong under
the content, never stuck to the bottom of the window, because a person on a
laptop should not have to look at two ends of the screen to finish a step.

**Creating a record is a dialog. The record is a page.** A new client or a new
pet is four or eight fields typed while a phone is ringing, so it opens over
the list it was started from. Reading, editing and everything with a link worth
sending stays a page with its own address. The create routes stay reachable for
anyone who lands on one directly.

**Nothing in a panel saves as you touch it.** The appointment panel opens with
a tap on a row, so its status and note are a draft with one button to commit
them. Reschedule and cancel keep their own dialogs, because they already ask.

**The staff sidebar belongs to the clinic.** Its top is the clinic name and its
switcher, not the product name, because the person working here knows what they
opened. A hairline separates it from the day. The account sits at the bottom
and opens upward: appearance, the booking page, privacy, sign out. On a phone
the same sidebar slides in from the left.

## Motion

Almost none. State changes ease over 150 ms. The auth sheet rises over 250 ms
on first paint. Nothing animates on entry inside the staff application. Every
transition is removed under `prefers-reduced-motion`.

## The states nobody designs

Every screen gets these before it is considered done. They are where real
products fail and where generated mockups never look.

**Empty.** No appointments today. No pets on file. No results.
**Loading.** Including the Neon cold start, which is real and needs a considered
skeleton rather than a spinner.
**Error.** The booking failed. The slot was taken while you were typing.
**Full.** Every slot booked, which is a success for the clinic and a dead end for
the owner, so it needs a next-available suggestion rather than an apology.
**Overflowing.** Sixteen appointments, long Filipino names that wrap, a missing
mobile number, a walk-in with no service selected.

That last one is the test. Design against the worst realistic day, not the
tidiest one.

## Accessibility

WCAG 2A and 2AA, verified with axe in the test run. Contrast on the tokens as
set:

| Pair | Ratio |
| --- | --- |
| `--text` on `--page`, light | 18:1 |
| `--text-2` on `--sheet`, light | 5.8:1 |
| `--text-2` on `--pill-2`, light | 4.9:1 |
| `--text-2` on `--sheet`, dark | 6.6:1 |
| `--error` on `--sheet`, light | 5.7:1 |
| `--error` on `--page`, light | 5.3:1 |
| `--error` on `--sheet`, dark | 6.6:1 |
| No-show text on its background | 5.6:1 |
| Overdue text on its background | 5.3:1 |
| `--text-3` on `--field` | 2.3:1, placeholder only, the label carries the meaning |

Status is never carried by colour alone. Focus is always visible. Touch
targets are at least 44 px. `prefers-reduced-motion` is respected. The
document language is `en-PH`.

## What changed from the first draft

- The accent hue question is closed. There is no accent hue. One pale blue tint marks featured content, and status has its own small palette.
- Hairlines became tone. Cards and inputs have no borders.
- Photography is part of the system, on entry surfaces only, with subject rules.
- The type scale, radii and spacing are fixed numbers now, not placeholders.
- The mark exists, as geometry, in `public/brand/`.
