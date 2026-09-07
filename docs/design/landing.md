# The landing page

What the marketing page is meant to do, how it is laid out, and what was
decided on 7 September 2026 when it was rebuilt. `../../DESIGN.md` owns the
design system. This file owns the one page that has to sell before anybody
signs in.

## Who it is for

The audience order in `AGENTS.md` holds here more than anywhere: a vet clinic
owner deciding whether to pay, then a founder evaluating the developer. A page
built to impress developers is a worse page.

The owner arrives from a Facebook link or a message. They are on a phone, they
have ninety seconds, and they have never heard of this. They need to see the
product, understand recall, and believe it costs nothing to try.

## What was wrong with the first version

Recorded so the same mistakes do not come back.

1. **Nothing on it was a picture.** Four grey placeholder blocks reading
   "Photograph, an aspin portrait". One fact did more damage than the rest.
2. **The product never appeared.** A working day view, booking flow and recall
   queue existed and none of them were on the page. The Kiko recall card was
   the only concrete thing and it sat in section four.
3. **Every section was the same shape.** Heading, paragraph, sometimes a card,
   same width and alignment top to bottom. Nothing anchored the eye.
4. **The rhythm was empty, not generous.** Two column sections left half the
   screen blank and the padding between short sections read as dead air.
5. **Thin at both ends.** The header was two buttons with no navigation and
   dropped "Sign in" entirely on a phone. The footer was four links.
6. **Two things were broken.** The pilot call to action pointed at
   `hello@kalinga.example`, which does not exist, and there was no OG image, so
   every link shared on Messenger rendered as a grey box.

## References

Looked at on Mobbin, 7 September 2026. The pattern that repeats across every
premium product site: the product is the hero image, not a photograph.

| Site | What was taken from it |
| --- | --- |
| [Tailscale](https://mobbin.com/sites/sections/e72d1d36-a761-4557-b655-d2797beb7abb), [ClickUp](https://mobbin.com/sites/sections/8327bdfc-5c9d-4240-b4af-9431eebd0f9e) | The interface beside the headline, one filled call to action and one quiet one |
| [Square](https://mobbin.com/sites/sections/54ba196c-c979-4564-a54a-c02a23e8e8f7) | Feature rows as image, short heading, two lines, hairline between. Editorial without colour, and the closest to this design system |
| [Twenty](https://mobbin.com/sites/sections/a29b4352-c6a5-4065-afd5-cd1af1cf2079) | Three product cards in a row, each cropped to do one job |
| [Notion](https://mobbin.com/sites/sections/8abed1a3-73c3-46af-a057-9e45bf8840bf) | The restrained end of the closing band and footer |

## The page, top to bottom

1. **Header.** Slim and sticky, transparent over the hero, then a hairline and
   a blurred ground past it. Anchor links give the page a spine. "Sign in"
   stays visible on a phone.
2. **Hero.** Headline, lead, two pills. Beside them the Today page in a light
   browser frame, tilted slightly, over a warm photograph bleeding off the
   right edge. The pale blue next appointment card floats on its corner.
3. **Fact strip.** Three plain facts between hairlines: built in Cagayan de
   Oro, free during the pilot, no per message fees. **Not a logo wall.** There
   are no customers yet and none will be invented.
4. **The problem.** One large sentence, centred, alone. The only loud section.
5. **How it works.** An eyebrow and a two word heading, then three rows on the
   Square pattern: a cropped product screenshot at the left, a heading and two
   lines at the right, a hairline between each. The screenshot stays on the
   left in all three rows. The board tried alternating sides first and the
   straight column reads calmer and more editorial.
6. **Recall.** The Kiko message card at full width with a working copy button.
   The most persuasive thing on the page.
7. **Made for how clinics here already work.** The local list against the
   puspin portrait.
8. **Pricing.** One card, free during the pilot, honest about what comes after.
9. **Questions.** The FAQ as an accordion so it is a screen, not a scroll.
10. **Closer and footer.** A call to action band, then a real four column
    footer.

## What the boards settled

Both boards are in `explorations/boards/`, dated 7 September 2026, $0.222 each.

Kept from them: the interface over a photograph bleeding off the right edge,
which is the single change that makes the page look finished. The fact strip
between two hairlines. The centred statement alone on the page. The three rows
with the interface always at the left. The recall card as a panel at the right
with the heading beside it.

Ignored from them: all of the body copy, which is generic and in one place
actively wrong. The board wrote "automated follow up that feels personal" and
Kalinga does not send anything automatically. The desk sends it. That
distinction is the product's honesty and the copy in `src/content/landing.ts`
already gets it right.

## Decisions

Taken 7 September 2026.

**The hero carries product over photograph.** Not one or the other. A clinic
owner has to see the thing they are buying, and the warmth is what stops it
reading like every other developer tool.

**Photography is restrained: three images.** Hero, the local section, the
closer. Punctuation, not wallpaper. Product screenshots do the explaining.

**The product is drawn, not screenshotted.** This changed during the build. A
screenshot was the plan, and the plan was wrong: it needs a clinic full of
invented rows in a database that was just emptied on purpose, it goes stale the
day it is taken, it cannot follow the reader into dark mode, and it is a heavy
image of type that a browser could set perfectly. The previews in
`src/components/marketing/previews.tsx` are built from the same tokens and the
same status pills the real screens use, so they stay true when the palette
changes and they weigh nothing. Every name in them is invented and lives in
`src/content/landing.ts`.

**The pilot call to action becomes a form on the site.** Name, clinic, city,
mobile or email. It follows the deletion request route exactly: validated,
honeypotted, rate limited per connection, emailed through Resend, and written to
the server log with an address to write to when no mail key is set. No table.
A lead is not tenant data and inventing one would have meant a new unscoped
table for four fields a mail server already stores.

## Motion

Noticed in its absence, not its presence. Everything below sits inside
`@media (prefers-reduced-motion: no-preference)`.

- Hero rises 12 px on load, 60 ms stagger between headline, lead, buttons, card.
- Sections reveal on entry with the same rise. Once, never on the way back up.
- The header hairline fades in after 24 px of scroll.
- Cards lift 2 px on hover. Copy message shows a real copied state.
- No parallax beyond a barely there drift on the hero photograph. No counters,
  no marquee, no typing effects.

**Technique: IntersectionObserver, not `animation-timeline`.** Firefox stable
still had scroll driven animations behind a flag in June 2026. Elements render
visible by default and only animate if the observer runs, so nothing needs
JavaScript to be readable.

## Assets

**Photography, generated with fal.** Three images from `openai/gpt-image-2` at
$0.222 each on 7 September 2026, converted to webp and none over 80 kB.

1. `public/marketing/aspin-clinic.webp`, the hero. Deliberately composed with
   empty floor on the left so the day view can sit over it.
2. `public/marketing/puspin-counter.webp`, the local section.
3. `public/marketing/reception-logbook.webp`, the closing band. A paper
   appointment book with a phone beside it, which is the thing this product
   replaces.

**The OG image is drawn, not generated.** `src/app/opengraph-image.tsx` renders
it with `ImageResponse` at 1200 by 630, using the real mark and the palette
module. An image model cannot set type, and this is the first thing anyone sees
when a link lands in Messenger.

One grade across all of them: natural light, warm, muted, shot like photography
rather than illustration. Filipino subjects and settings, because the
positioning is Northern Mindanao and not a stock photo of anywhere.

**Interface previews, drawn.** The day view, the booking flow on a phone and
the recall queue, all in `src/components/marketing/previews.tsx`.
