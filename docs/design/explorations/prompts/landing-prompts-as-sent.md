# Landing page board prompts, as sent

Model `openai/gpt-image-2`, 1440 by 2560, quality high, 7 September 2026.
The fal pricing tool reports this endpoint in opaque "units", so the price
carried forward is the one billed on 5 September at 2560 by 1440 high, $0.222
per image.

Every prompt repeats the design system paragraph verbatim, because the boards
have to read as one page and the model has no memory between runs.

## Shared design system paragraph

> Design system, follow exactly: pure white page background, near black text,
> one step of very light warm grey for raised panels, thin hairline dividers,
> and no other colours anywhere except a single pale blue chip. Modern
> geometric grotesk type with tight letter spacing on headings. Buttons are
> full pill shapes, near black filled primary and light grey secondary. Cards
> have large 24 pixel corner radius. No drop shadows. Generous white space.
> Minimal, editorial, Swiss, premium enterprise SaaS.

## Board one, the top of the page

Header, hero with the product interface over a photograph, the fact strip, and
the large centred statement. Full text in the session transcript; the sections
requested were:

1. Slim transparent header, mark and wordmark left, four anchor links centre,
   Sign in and a black Get started pill right.
2. Hero in two columns. Headline, four line lead, two pills. On the right a
   light browser frame holding a day schedule, tilted slightly, over a warm
   photograph of a Filipino street dog bleeding off the right edge, with a pale
   blue next appointment card floating on the frame's lower left corner.
3. A row between two hairlines: Built in Cagayan de Oro, Free during the pilot,
   No per message fees.
4. A centred statement, three lines, reading A dog vaccinated in March is due
   next March.

## Board two, the middle of the page

The three how it works rows and the recall section.

## What the model gets wrong every time

- It draws its own logo. The real mark is in `public/brand/`.
- It writes its own body copy, and the copy is generic marketing. Ours is in
  `src/content/landing.ts` and is better. It also reaches for em dashes, which
  the house style bans.
- Product interfaces in the boards are invented. The real ones are captured
  from the running product.

None of that matters. The boards are for layout, rhythm and weight.
