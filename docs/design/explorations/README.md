# Explorations

Generated boards, vector candidates and the prompts that produced them. A
board without its prompt cannot be reproduced, so the two are kept together.
Nothing here is the design system. `../../../DESIGN.md` is. This folder is the
evidence for how it was reached.

All prices were read from the fal pricing tool on the day and are recorded
because fal changes them without notice.

## Boards

| File | Model | Price | Verdict |
| --- | --- | --- | --- |
| `boards/2026-09-05-staff-sign-in-gpt-image-2.png` | GPT Image 2, 2560 by 1440, high | $0.222 | **The reference board.** Followed every layout rule. |
| `boards/2026-09-05-staff-sign-in-nano-banana-pro.png` | Nano Banana Pro, 16:9, 2K | $0.15 | Rejected. Landscape phones, an added title, and the mark drawn as a face, which became the logo. |
| `boards/2026-09-07-landing-top-gpt-image-2.png` | GPT Image 2, 1440 by 2560, high | $0.222 | Kept. Header, hero with the interface over a photograph, fact strip and the large statement. Layout followed exactly. Its logo, body copy and product interface are invented and are replaced by the real ones. |
| `boards/2026-09-07-landing-middle-gpt-image-2.png` | GPT Image 2, 1440 by 2560, high | $0.222 | Kept. The three how it works rows and the recall section. |

Two earlier boards were generated in ChatGPT before the work moved to fal and
were not saved from the chat. They should be added here as
`boards/2026-09-05-staff-sign-in-chatgpt-earth-tone.png` and
`boards/2026-09-05-staff-sign-in-chatgpt-monochrome-vet.png`. What they showed
and why they were rejected is recorded in `../direction.md`.

The landing prompts are in `prompts/landing-prompts-as-sent.md`, the full page
prompt written for ChatGPT is in `prompts/landing-full-page-chatgpt.md`, and
what the page is meant to do is in `../landing.md`.

## Photographs

Shipped in `public/marketing/`, converted to webp. All three from GPT Image 2 on
7 September 2026 at $0.222 each, one grade across the set: 50mm, natural light,
warm neutral, unposed, nobody in frame.

| File | What it is |
| --- | --- |
| `aspin-clinic.webp` | The hero. An aspin in clinic light, composed with empty floor on the left for the day view to sit over. |
| `puspin-counter.webp` | A puspin on a clinic counter, for the local section. |
| `reception-logbook.webp` | A paper appointment book and a phone on a reception counter, for the closing band. The thing this product replaces. |
| `auth-vet-aspin.webp` | Sign in. A vet steadying an aspin on a steel table, framed below the shoulders so no face is in it. |
| `auth-puspin-window.webp` | Sign up and the invitation page. A puspin asleep on a clinic windowsill in jalousie light. |
| `auth-aspin-corridor.webp` | Password reset. A black aspin in a shaded corridor, the darkest of the set. |

Six photographs at $0.222 each, $1.33 in total. Three for the landing page on
7 September and three for the auth pages the same day.

## Logo

All vectors from Recraft V4 text to vector at $0.08 each. The prompts are in
`prompts/logo-prompts-as-sent.md` in the order they ran.

| File | What it is | Verdict |
| --- | --- | --- |
| `logo/recraft-crescent-grid.svg` | Nine variations of a dot inside a crescent | Rejected. Reads as an eclipse or a night mode toggle. |
| `logo/recraft-crescent-single.svg` | One crescent mark | Rejected, same reason. |
| `logo/recraft-smile-a-flat-ends.svg` | Smile with unequal dots, flat cut arc ends | Rejected. The flat ends look unfinished. |
| `logo/recraft-smile-a2-flat-ends.svg` | Same, round caps requested and ignored | Rejected. |
| `logo/recraft-smile-a3.svg` | Smile with unequal dots, round caps | The closest vector to the chosen direction. |
| `logo/recraft-smile-b-equal-dots.svg` | Smile with two equal dots | Rejected. The generic smiley. |
| `logo/recraft-smile-c-single-dot.svg` | Smile with one dot | Rejected. Reads as a wink. |
| `logo/recraft-small-size-test.png` | A3, B and C at 16, 32 and 64 px | Showed A3's small dot vanishing at 16 px, which the final geometry fixed. |

The chosen mark was refined in ChatGPT from the Nano Banana Pro reading and
then rebuilt as geometry in `../../../public/brand/`. The ChatGPT renders are
`logo/chatgpt-lockup.png`, the mark with the wordmark on white, and
`logo/chatgpt-mark.png`, the mark alone on a transparent background.

## Prompts

| File | What it is |
| --- | --- |
| `prompts/staff-auth-shared.md` | The block that goes at the top of every staff auth board run. Final version, with the real mark described. |
| `prompts/run-1-sign-in.md` to `prompts/run-5-choose-clinic.md` | The screen list for each of the five auth boards. Run 1 has been generated. Runs 2 to 5 are ready. |
| `prompts/run-1-sign-in-as-sent.txt` | The exact text sent to GPT Image 2 for the reference board, before the mark was final. |
| `prompts/logo-prompts-as-sent.md` | The seven Recraft prompts, as sent. |

## How to run one

Read the price first, then send the shared block followed by one run file as a
single prompt. GPT Image 2 takes an explicit `image_size` of 2560 by 1440 with
`quality` high. Save the output here with the date and the model in the name,
and add a row to the table above with the verdict.
