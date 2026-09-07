# Landing page, full page mockup, handoff to ChatGPT image generation

For pasting into ChatGPT on the web when the mockup is being generated there
rather than through fal. Written 7 September 2026 after the two GPT Image 2
boards in `../boards/` were rejected.

Everything below is deliberate. The hex values are the real light mode tokens
from `src/app/globals.css`, the radii are the real radius scale, and the copy
is the real copy from `src/content/landing.ts`. A mockup that invents its own
palette or its own marketing lines cannot be built from.

## How to run it

Send the master prompt first. When the full page comes back, the type inside
the smaller sections will be too compressed to judge, so stay in the same
conversation and ask for close-ups: "now show only the hero at desktop width",
"now only the three feature rows", "now only the pricing, questions and
footer". Same conversation keeps the style consistent.

To change the direction, swap the one line marked ART DIRECTION. Three
alternatives are at the bottom.

---

## Master prompt

Design a complete marketing landing page for a software product, rendered as
one tall full page desktop screenshot at 1440 pixels wide. Show the whole page
from the header to the end of the footer in a single continuous image.

ART DIRECTION: quiet Swiss minimalism. White ground, near black type, thin
hairlines, generous white space, no decoration that is not information.
Restrained and expensive, the way a well made tool looks rather than the way an
advertisement looks.

THE PRODUCT: Kalinga, booking and recall software for independent veterinary
clinics in the Philippines. Calm, practical, warm. Not playful, not corporate,
not medical.

EXACT COLOURS, use these and no others:
- Page ground: #FFFFFF
- Raised panel or card: #F5F5F7
- A control inside a panel: #EBEBEE
- Hairline dividers and card borders: #E4E4E9
- Primary text: #0A0A0A
- Secondary text: #656569
- Faint text: #A0A0A6
- Filled buttons: #0A0A0A with #FFFFFF text
- Exactly one accent, a pale blue #D9E5F5, used only on a small status chip and
  one floating card. Nowhere else on the page.
No gradients, no purple, no teal, no brand blue, no coloured icons.

TYPE: a modern geometric grotesk close to Inter. Headings tight, around minus
one percent letter spacing, weight 500 to 600, never heavier. Body at a
comfortable 17 pixels with generous line height in #656569. Section headings 28
pixels. The one hero headline much larger, around 44 pixels over three lines.
Small labels 13 pixels.

SHAPE: buttons are full pills, 52 pixels tall on desktop. Cards use a 20 pixel
corner radius, large panels 24, quoted blocks 16, small chips 8. No drop
shadows anywhere except one soft lift under the floating hero card and the
browser frame behind it. Separation is done with tone and hairlines, not with
shadows or borders.

LAYOUT: a 1200 pixel content column centred on the page with wide margins.
Sections are separated by large vertical space, around 120 pixels, and
occasionally a full width hairline.

Now the page, top to bottom, with this exact text:

1. HEADER, slim and transparent. At the left a small dark abstract mark and the
   wordmark "Kalinga". In the centre four small grey text links: How it works,
   Recall, Pricing, Questions. At the right the text link "Sign in" and a black
   pill button reading "Get started".

2. HERO, two columns, the text column narrower than the image column.
   Left: a headline over three lines, "Your clinic's appointment book, off
   paper. And it remembers." Under it a four line paragraph in grey: "Kalinga
   takes bookings on a page you share on Messenger, runs your day from one
   screen, and tells you which animals are due for a vaccination, deworming or
   groom. Built for independent vet clinics in Northern Mindanao." Under that
   two pills side by side, a black "Get started" with a small right arrow and a
   light grey "Sign in".
   Right: a light browser window frame, tilted about three degrees, containing
   a clean appointment schedule: a horizontal strip of seven weekday tiles with
   one tile filled black, then five appointment rows each showing a time, a pet
   name, an owner name, a service and a small grey status chip. Behind the
   frame, bleeding off the right edge of the page, a warm natural light
   photograph of a Filipino street dog sitting calmly in a bright tiled clinic.
   A small pale blue card floats over the lower left corner of the frame
   reading "Next appointment" above "Kiko, 9:30 AM, Vaccination" and a small
   chip reading "Confirmed".

3. FACT STRIP, a full width row between two hairlines, three short grey facts
   evenly spaced: "Built in Cagayan de Oro", "Free during the pilot", "No per
   message fees". No logos, no company names, no numbers.

4. THE PROBLEM, centred, alone, with a lot of air. A 28 pixel heading "The
   revenue you already earned" and beneath it, set large over three lines: "A
   dog vaccinated in March is due next March. Whether your clinic sees that
   visit depends on whether someone wrote it in the logbook and then looked at
   the logbook. Most do not. Kalinga does."

5. HOW IT WORKS. A small grey label "How it works" above a 28 pixel heading
   "Three things". Then three full width rows separated by hairlines. In every
   row the product screenshot is on the LEFT, about 480 pixels wide with a 20
   pixel radius and a hairline border, and the text is on the right. Do not
   alternate the sides.
   Row one, heading "Booking", body "Pet owners book on their phone in under a
   minute, no account, no app. You share one link on your Facebook page and the
   appointments arrive in your day." Image: a phone sized booking screen with a
   grid of appointment time slots.
   Row two, heading "The day", body "One screen runs the morning. Who is
   coming, who has arrived, who cancelled, who did not turn up. Walk-ins go in
   without a service until the vet decides." Image: a desktop day schedule with
   rows of appointments and small status chips.
   Row three, heading "Recall", body "Every Monday, every animal due that week,
   with the message already written. Copy it into Messenger or a text and mark
   it sent. That is the whole workflow." Image: a list of pets due, each row
   with a small chip reading Due.

6. RECALL, two columns. Left: a 28 pixel heading "Recall is the reason anyone
   pays" and a grey paragraph, "Vaccinations are yearly. Deworming is every
   three months. Grooming is every four to six weeks. Kalinga counts from the
   last visit and writes the message. The desk sends it the way it already
   talks to that client." Right: a wide #F5F5F7 card containing "Kiko" in bold
   with "Aspin" in grey beside it, a small pale blue chip reading "Due" at the
   top right, a line of small grey text reading "Maria Kristina Angelica de los
   Santos Villanueva, 0917 555 0101", then a white quoted block with a 16 pixel
   radius holding the message: "Hi Maria, this is Lunhaw Animal Clinic. Kiko's
   vaccination is due on 2 October. Book a slot at kalinga.cjjutba.dev/lunhaw
   or reply here and we'll fit you in." Below it two small pills, a grey "Copy
   message" and a black "Mark sent".

7. MADE FOR HOW CLINICS HERE ALREADY WORK, two columns. Left: the heading and
   four bullet points, each a small dark dot and two lines of grey text:
   "Prices in pesos, payments in cash or GCash. No card gateway, no per message
   fees." / "Reminders go out through whatever you already use with that
   client. Kalinga writes them, you send them." / "Times in Philippine time,
   labelled, even for someone booking from abroad for their parents' dog." /
   "Aspin and puspin are breeds here, not mixed." Right: a warm natural light
   photograph of a Filipino domestic cat, portrait crop, 20 pixel radius.

8. PRICING, one wide #F5F5F7 card with a 24 pixel radius, the heading "Free
   during the pilot" and a grey paragraph, "The first clinics in Cagayan de
   Oro, Iligan and around Northern Mindanao use Kalinga free while it is being
   finished with them. After that, one flat monthly fee in pesos. No per
   booking charge, no per message charge, no contract." A black pill at the
   right reading "Talk to us about a pilot" with a right arrow.

9. QUESTIONS, a narrower centred column. Heading "Questions clinics ask", then
   four accordion rows separated by hairlines, each with the question in dark
   medium weight and a small chevron at the right. The first row is open and
   shows its answer in grey. The questions: "Do my clients need an account?",
   "Does Kalinga send the reminders?", "Is my clients' data safe?", "What about
   medical records?" The first answer: "No. They book with a name and a mobile
   number. A link on their confirmation lets them change or cancel."

10. CLOSING BAND, centred, generous space: a 28 pixel line reading "Take your
    first booking this week" and a black pill "Get started".

11. FOOTER, above a hairline, four columns of small links under short grey
    headings, with the mark and wordmark at the left along with the line
    "Kalinga is Filipino for tender care." At the very bottom, small and grey,
    "All rights reserved. Built in Cagayan de Oro."

HARD CONSTRAINTS:
- No customer logos, no testimonials, no star ratings, no avatars of people, no
  invented statistics or percentages. This product has no customers yet and the
  page must not pretend otherwise.
- No em dashes or en dashes in any text. Commas or full stops only.
- No stock photo collages, no illustrations, no 3D shapes, no icons inside
  coloured circles, no glassmorphism, no dark mode.
- Every piece of text must be the text given above. Do not write new marketing
  copy and do not use the words automated, seamless, effortless or powerful.
- Render it as a believable web page screenshot with sharp legible type, not as
  a poster or a presentation slide.

---

## Alternative art direction lines

Swap the single ART DIRECTION line for one of these and send again.

**Editorial.** "Editorial and warm. A large serif display face for headings
against the same grotesk for body text, wider outer margins, photography given
more room and allowed to bleed. It should feel like a well set magazine feature
about a clinic rather than a software page."

**Product forward.** "Dense and product forward. Tighter vertical rhythm, more
interface visible per screen, smaller type, and a faint square grid in the
background behind the hero only. It should feel like a developer tool that
happens to be for vets."

**Soft and human.** "Soft and human. Slightly warmer greys, larger corner
radii throughout, more photography, and one gentle band of very pale blue
behind the recall section. Still minimal, but friendlier than clinical."
