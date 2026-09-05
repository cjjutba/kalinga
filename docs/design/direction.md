# Visual direction

## How the direction gets decided

Three tools, three different jobs. Using the wrong one for a job is how a week
disappears.

**Image generation expresses intent.** What should this feel like. Warmth,
density, whether a day reads as a list or a board, how much the interface should
recede. It is exploring a direction that does not exist yet, which is the one
thing a reference library cannot do.

**Claude Design turns the chosen direction into artboards.** Clickable HTML in
the real design system, with real text at real sizes. This is where a mockup
becomes something you can judge, because a picture of an interface and an
interface are different objects.

**A pattern library gets consulted when a specific interaction is stuck.** Not for
inspiration. For questions like what a booking product does when the next three
days are fully booked, which is a solved problem somebody has already solved
badly enough to learn from.

## What to ask an image model for

Not the tidy version.

Ask for a Tuesday with sixteen appointments, two cancelled, one no-show, one
walk-in with no service selected, and a client name long enough to wrap. If a
layout survives that it survives everything, and a layout designed against four
tidy rows will break the first week a real clinic uses it.

Two things not to ask for. Anything where small text carries meaning, because it
renders as noise. And the slot picker, because it is an interaction rather than a
picture and it gets designed in the browser against real availability data.

## The accent

One accent colour, used for the primary action and for status. Everything else
stays neutral.

The hue is chosen during this step rather than assumed in advance. Three tests it
has to pass.

Legible as a small status dot in a dense day view. Readable as a large filled
button on a phone in daylight. Not alarming, because a booking confirmation is
not a warning.

The starting proposal is a warm earth tone. Veterinary products reach for
clinical teal or a bright orange that makes them look like toy brands, and
neither matches a product named after tender care.

## Two audiences, two shapes

**The client side is a phone.** Pet owners book one-handed, probably standing up,
possibly outside. Thumb reach matters. The desktop layout is the adaptation.

**The staff side is a counter.** Used all day, at a desk, by someone who already
knows the interface. Density beats decoration. The person using it does not need
to be impressed, they need to find Tuesday.

Designing both to the same rules is the most common way clinic software becomes
unusable.

## What gets written back here

Once the design step lands, the accent, the type scale and the spacing rhythm get
written into `../../DESIGN.md`, and this file keeps only the reasoning.
