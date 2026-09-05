# Screens

The screens, in the order they get designed, and where each one stands. The
full page inventory with routes and roles is in `pages.md`. This file is about
which ones get designed before code and against what.

Only the first four get designed before code. The rest are better decided
against a running application.

---

## 0. Staff auth and onboarding

**Designed.** Sign in has a reference board at
`explorations/boards/2026-09-05-staff-sign-in-gpt-image-2.png`. Invitation,
reset, create clinic and choose clinic follow the same layout rules and their
prompts are written in `explorations/prompts/`, ready to run when a board is
needed.

Went first because it was the cheapest place to settle the design system.
Five pages, one form shape, every state the system needs to prove: error,
loading, dark, long names, and photograph against interface.

The layout rules that came out of it are in `DESIGN.md` under spacing and
layout. The one thing to carry into the build rather than the board: the
phone sheet rises over a photograph, and when the keyboard opens the
photograph has to collapse or the form will not fit.

## 1. Public booking

**Next.** The screen the business depends on. A pet owner picks a service,
picks a vet or accepts any, chooses a slot, and confirms.

Mobile first and one handed. It is the last step before a commitment, so it has
to feel certain.

**The states that decide whether it is any good.** Every slot booked, which is a
success for the clinic and a dead end for the owner and needs a next available
suggestion rather than an apology. The next three days empty, which should be
shown honestly rather than skipped past. And the slot taken while someone was
typing, which is a real race and a real error state.

The Future Pro slot picker on Mobbin is the pattern to start from: a date
strip with the selected day filled, a two column grid of slot tiles, and an
honest "none of these times work for me" escape. The picker itself is still
designed in the browser, not on a board.

## 2. Staff day view

The screen used most. Today in time order, with status visible at a glance.

Confirm, cancel, reschedule, mark arrived. Walk-ins added without a service.

**Design it against a bad Tuesday.** Sixteen appointments, two cancelled, one
no-show, a name that wraps to two lines, a missing mobile number. If it holds
there it holds anywhere.

Status has to be readable without relying on colour alone, because a receptionist
who cannot distinguish cancelled from confirmed is a receptionist who double
books. The status palette and its non colour cues are fixed in `DESIGN.md`.

## 3. Pet record

What a vet opens mid consultation. Who the animal is, what happened last time,
what is due next.

Weight, vaccination and deworming dates, visit history. The recall dates are the
part that matters, because they are what the whole product exists to remember.

---

## Designed later, against running code

**Recall queue.** What is due this week, grouped, with the message written and
ready to copy. Design this after F5 exists, because it depends on what a record
actually holds.

**Owner settings.** Services, hours, staff, permissions. Dull and important. It
gets designed when it gets built.

**Client portal.** A pet owner's own animals and appointments. Small surface,
and blocked on the identity question in `pages.md`.

**The landing page.** After F4, once there is a product to describe. This is
where photography earns the most, and where the positioning is Philippine
rather than generic. Pesos, the channels clinics actually use, and Northern
Mindanao named on the page.
