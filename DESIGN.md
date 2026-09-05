# Design system

Kalinga is a product, not a portfolio. That difference decides most of what
follows.

## What it inherits, and what it does not

It takes the **architecture** of the design system on cjjutba.dev. A single
neutral ramp addressed through semantic tokens, hierarchy from weight and colour
rather than size, hairlines instead of boxes, and a small fixed type scale.
Those choices survive because they make a system maintainable by one person.

It does **not** take the monochrome. A portfolio can be austere. A product called
tender care cannot. A pure greyscale interface for a clinic that treats sick
animals reads as cold, and it also fails a practical test, because staff need to
scan a day view and see at a glance what is confirmed, arrived, cancelled or
overdue. Status needs colour to be legible at speed.

## The accent rule

**One accent, used in two places only.** The primary action, and status.
Everything else stays on the neutral ramp.

The hue is deliberately not fixed here. It gets chosen during the design step,
where the point is to look at options rather than inherit a decision. The
starting proposal is a warm earth tone rather than the clinical teal that every
veterinary product reaches for, and rather than the bright orange that makes them
look like toy brands.

Whatever is chosen has to survive three tests. It must be legible as a small
status dot on a dense day view. It must work as a large filled button on a phone
in daylight. It must not read as an alert, because a booking confirmation is not
a warning.

Status colours beyond the accent are limited to what the day view genuinely
needs. Confirmed, arrived, cancelled, no-show, overdue. Five states, five
treatments, no more.

## Mobile first, and which screen decides it

The client side is designed for a phone before anything else, because pet owners
book on a phone. The desktop layout is the adaptation, not the source.

The slot picker is the screen that decides the quality of the whole product. It
is dense, it is the last step before a commitment, and it is used one-handed. It
gets designed in the browser against real availability data rather than from a
mockup, because it is an interaction rather than a picture.

The staff side is the reverse. It is used on a desk, all day, at a counter. It is
designed for a laptop first and has to survive a long day of use, which means
density over decoration.

## Type

The same discipline as the portfolio. A small fixed scale, hierarchy from weight
and colour, no display face.

Four sizes, plus one step up for page titles. Sizes settle during the design step
and get written back here once they do. The rule that matters more than the
numbers is that the scale stays small and nothing gets added to it casually.

## Tokens

A neutral ramp stored as raw channels so alpha can be applied at the point of
use, addressed through semantic aliases rather than directly. Light and dark are
both real, and dark is a token remap so components need no dark-specific work.

Never hardcode a colour outside the accent and status definitions.

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

WCAG 2A and 2AA, verified with axe in the test run. Status must never be carried
by colour alone, because a day view that distinguishes cancelled from confirmed
only by hue fails for a colourblind receptionist. Pair every status colour with a
label or a shape.

Respect `prefers-reduced-motion`.

## Components

The component list is written here as it is built, not invented in advance. What
is fixed now is the principle. A primitive exists when a pattern appears three
times, and it lives in `src/components/primitives/` with the reasoning in its
file header.
