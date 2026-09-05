# Visual direction

How the look of Kalinga was decided, what was tried, and what was rejected.
The numbers that came out of it live in `../../DESIGN.md`. This file keeps the
reasoning so nobody reopens a settled question by accident.

## What was decided

Near white and near black, tone instead of borders, pill buttons, one pale
blue tint for featured content, and photography of animals as the only
warmth. No accent hue. The mark is a smile with two unequal dots.

The reference board is
`explorations/boards/2026-09-05-staff-sign-in-gpt-image-2.png` and the prompt
that produced it is beside it in `explorations/prompts/`.

## How it was decided

Three tools, three different jobs. Using the wrong one for a job is how a week
disappears.

**Image generation expresses intent.** What should this feel like. Warmth,
density, whether a form reads as a settings page or a product, how much the
interface should recede. It explores a direction that does not exist yet,
which is the one thing a reference library cannot do. The first boards were
generated in ChatGPT. Once its daily limit was hit the work moved to fal.ai,
called from inside the agent session so each output could be judged, adjusted
and saved next to its prompt without a copy and paste loop.

**A pattern library gets consulted for a specific problem.** Not for
inspiration. Mobbin was used once, to look at how Future Pro handles a booking
flow, and that one look changed the direction more than any generated board.
Its system is small: a grey page, white cards with no borders, a black pill,
photography for warmth, and a guide card with a coach's avatar that makes a
form feel like a person. Kalinga borrows that structure.

**Claude Design turns the chosen direction into artboards.** Clickable HTML in
the real design system with real text at real sizes. That step comes next,
against these numbers, because a picture of an interface and an interface are
different objects.

## What was tried, in order

**Board one. Warm earth tone, hairline borders, cream page.** Rendered
exactly as asked and rejected on sight. Clay read as orange. The error text
shared a hue with the links so the error state had no voice. Cream on cream
looked like paper. A laptop layout with a typographic left column was dead
space. Hairlines with no surfaces made every frame a settings page.

**Board two. Monochrome, black pill, photograph of a vet with a dog.** The
structure landed and four fixes were noted: inputs were white on white and fell
back to hairlines, the tablet frame was a stretched phone, the demo entry took
two lines to say one thing, and the floating card was too small to carry the
one colour on the board. The photograph was the stock image every clinic
website already has, and a human face in the hero pulled attention from the
form.

**Board three. Same system, an aspin portrait, the mark in the lockup.** Run
on two models from one prompt. GPT Image 2 followed every layout rule. Nano
Banana Pro rotated the phones to landscape, added a title it was told not to,
and drew the mark as a face. The face was better than the brief. It became the
logo.

## The accent, and why there is none

The first draft of `DESIGN.md` proposed a warm earth tone because veterinary
products reach for clinical teal or toy store orange and a product named after
tender care should do neither. The earth tone failed the test that mattered: it
looked like orange in a rendered button. The next proposal was blue. Looking at
the Future Pro reference made the case against any accent at all. Warmth from
a photograph is warmer than warmth from a button, and a black pill reads as
certain in a way no colour does.

What survives of the accent idea is one pale blue tint on featured content
cards, borrowed from the way Future Pro tints its kickoff card, and a small
status palette that the day view genuinely needs.

## The mark

The brief was a solid dot held by a thick open arc. Three models read it three
ways. Recraft drew a crescent with a dot inside, which reads as an eclipse or a
night mode toggle. GPT Image 2 drew a dot inside an open ring with the gap at
the top, which reads as a power button. Nano Banana Pro drew a smile with a
small dot above the left end and a larger dot above the right, which reads as
a face that is holding something. That third reading was chosen, refined in
ChatGPT into the version in the lockup, and rebuilt as geometry in
`public/brand/` so it scales to a favicon. The rejected vectors are kept in
`explorations/logo/` with the prompts that produced them.

Every pet product uses a paw print. Kalinga does not.

## Models, and what they cost

Prices checked with the fal pricing tool before every run, because fal changes
prices without notice. All figures from 2026-09-05.

| Job | Model | Price | Verdict |
| --- | --- | --- | --- |
| UI boards | GPT Image 2 at 2560 by 1440, high | $0.222 per board | Keep. Followed every layout rule. |
| UI boards | Nano Banana Pro, 2K | $0.15 per board | Reject. Landscape phones, extra title, ignored copy rules. |
| Vector marks | Recraft V4 text to vector | $0.08 per mark | Keep for vectors. Ignores round cap instructions about half the time. |

The whole design step, twelve generations, cost about one dollar.

## How to prompt for the next screen

The rules that produced the reference board, so the next board does not
relearn them.

- One board per page, six frames: phone, tablet and laptop in the default state, then three phone states. More frames than that and the text turns to noise.
- Give the exact on screen copy and say "nothing more". Models add titles and subtitles when left to themselves.
- State layout rules per device before the screen list. Where the photograph goes, where the sheet goes, what overlaps what.
- Name the states. Empty, loading, error, full, overflowing. Ask for the bad Tuesday, never the tidy version.
- One photograph per run, described once, with the same subject rules as `DESIGN.md`.
- Never ask for the slot picker. It is an interaction and it gets designed in the browser against real availability.
- Read the price back before the run. Save the output and the prompt together in `explorations/`.

## Two audiences, two shapes

**The client side is a phone.** Pet owners book one handed, probably standing
up, possibly outside. Thumb reach matters. The desktop layout is the
adaptation.

**The staff side is a counter.** Used all day, at a desk, by someone who
already knows the interface. Density beats decoration, which is why there is
no photography inside the application. The person using it does not need to be
impressed, they need to find Tuesday.

Designing both to the same rules is the most common way clinic software
becomes unusable.
