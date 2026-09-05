# Staff auth, shared block

Goes at the top of every staff auth board run, followed by one run file. Send
the two together as a single prompt. Model: GPT Image 2 through fal, endpoint
`openai/gpt-image-2`, `image_size` 2560 by 1440, `quality` high, `output_format`
png. Read the price back before running.

```text
Create an ultra-high-resolution UI showcase board for "Kalinga", a booking, records and recall reminder product for small veterinary clinics in the Philippines. This board covers STAFF AUTH AND ONBOARDING only: the pages a clinic owner, vet or receptionist uses to sign in, accept an invitation, reset a password, create a clinic and choose a clinic.

PRESENTATION
Large professional UI presentation board, 16:9 landscape, flat light grey board background #E9E9EC. The page is shown at three sizes with consistent device frames: an iPhone in portrait with an accurate iOS status bar, an iPad in portrait, and a laptop browser window with the address kalinga.cjjutba.dev in the URL bar. Six frames sit in a clean evenly spaced grid, three on the top row and three on the bottom row, no overlapping, every screen fully visible, thin realistic device bezels, crisp fully readable UI text. Show the exact on-screen copy given below and nothing more. No board title, no captions. Few words per screen, large legible labels.

LOGO
The Kalinga mark is a smile: a thick arc with round caps, a small solid dot floating above its left end and a larger solid dot resting above its right end. Single weight, geometric, no gradients, no outlines. Near black on light surfaces, white on photographs and dark surfaces. The lockup places the mark to the left of the wordmark "Kalinga", set in the interface typeface at bold weight, sentence case, with the mark 1.6 times the cap height and its bottom on the descender line. Use the identical mark in every frame. NOT a paw print, NOT a heart, NOT a cross, NOT a third dot.

LAYOUT RULES
Phone: the top 40 percent is the full bleed photograph with the white logo lockup at the top left. A white sheet with 24 px top corners rises over the photo and holds the form.
Tablet portrait: the photograph fills the top third with the white lockup over it. A white sheet 480 px wide with 24 px corners overlaps the bottom edge of the photo by 24 px and holds the form, centred on the grey page.
Laptop: left half is the full bleed photograph with one floating product card over it and one line of white text at the bottom left, "Booking, records and recall for veterinary clinics in Northern Mindanao." Right half is the grey page with the near black lockup top left and the form in a 400 px column vertically centred.

DESIGN STYLE
Minimal premium monochrome product design in the manner of Future, Oura and Linear. Near white and near black only, with photography carrying all the warmth. Light mode is a soft grey page with white sheets and cards. Dark mode is a near black page with dark grey sheets and cards. Cards and sheets have 20 to 24 px radius, no border and no visible shadow, separated from the page by tone alone. Inputs are filled light grey with 14 px radius and no border, sitting on the white sheet. Buttons are full pills, 52 px tall on phone. Primary action is a solid near black pill with white text in light mode, and a white pill with near black text in dark mode. Secondary is a light grey pill with near black text. Tertiary is plain text at medium weight. Selected states fill near black with white text. Generous spacing, left aligned text, one idea per screen. Error states use a red ring on the field and one line of red helper text, no banners. Loading uses a small spinner inside the pill and skeleton cards where a list would appear.
NOT glassmorphism, NOT 3D renders, NOT gradients, NOT glow, NOT illustrations, NOT icon tiles, NOT coloured buttons, NOT teal, NOT orange, NOT cream, NOT hairline borders around inputs or cards. Calm, certain, warm through the photographs and cool through the interface.

PHOTOGRAPHY
One animal portrait, no people, no clinic, no props. The subject for this run is named in the screen list. Head and shoulders, sitting calmly, looking just past the lens, soft daylight from a window to one side, plain warm grey wall behind, shallow depth of field, matte film-like colour, slightly desaturated. Editorial and quiet, in the manner of Oura's photography. Use the same photograph in every frame of the board so the system reads as one product. No leash, no collar tags, no steel table, no scrubs, no stock smiles, no sick or injured animals.

FLOATING PRODUCT CARD
On the laptop photo panel only. A card about 320 px wide with 20 px radius in pale blue #D9E5F5, titled "Next appointment", with a round pet avatar, the line "Kiko, 9:30 AM, Vaccination" and a small white pill tag "Confirmed". Tilted three degrees, soft shadow, large enough to read as a deliberate product artefact. This pale blue is the only colour in the interface and appears only on this card, never on buttons or text. No washes, no patterns, no gradients anywhere else.

GUIDE CARD
On onboarding steps only, never on sign in: a light grey filled card with 16 px radius holding a round photo avatar of "Dr. Ana Reyes", her name in 15 px medium weight, and one sentence in her voice, like a note from a colleague.

COLOUR PALETTE
Light: page #F5F5F7, sheet and card #FFFFFF, input fill and guide card #F2F2F4, primary text #0A0A0A, secondary text #6B6B70, placeholder #A0A0A6, primary pill #0A0A0A with white text, pressed #262626, secondary pill #EBEBEE, selection fill #0A0A0A, focus ring #0A0A0A at 2 px. Dark: page #0A0A0A, sheet and card #161618, input fill and guide card #1F1F22, primary text #F5F5F7, secondary text #9A9AA1, primary pill #F5F5F7 with #0A0A0A text, secondary pill #26262A, selection fill #F5F5F7. Featured card tint #D9E5F5 in light and #1B2A40 in dark. Error #D92D20 in light and #F97066 in dark, used only for the field ring and helper text. Text links use primary text colour at medium weight, no underline, no blue.

TYPOGRAPHY
One grotesque sans-serif in the spirit of Inter. Scale: 28 px page titles at medium weight, 20 px card titles, 17 px body and inputs, 15 px secondary, 13 px field labels. Sentence case everywhere, no letterspaced caps, no display face. Long Filipino clinic names wrap to two lines cleanly.

ICONS
Very few. 1.5 px rounded line icons in primary text colour: an eye toggle in password fields, a chevron on list rows, a check on completed steps, a plus on add rows. No filled icons, no colour.

Render as a real product screenshot set: calm, dense where it needs to be, production ready, one visual system across every frame.
```
