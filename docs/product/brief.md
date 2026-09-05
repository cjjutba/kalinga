# Product brief

## The one sentence

Kalinga takes a veterinary clinic's appointment book off paper and remembers what
every animal is due for next.

## Who it is for

Small independent veterinary clinics in the Philippines, starting with Northern
Mindanao. One to four vets, a receptionist, a groomer. The kind of practice that
runs on a physical logbook, a Facebook page for enquiries, and a staff member's
memory for who is due a vaccination.

Not chains, not hospitals, not anyone with an IT department.

## Why veterinary

A scan of qualifying businesses across Cagayan de Oro, Iligan, Ozamiz, Oroquieta,
Tangub, Plaridel and Malaybalay found more veterinary clinics than dental
clinics, and the median vet carried roughly double the review count of the median
dental clinic. More targets, each one busier.

Three reasons beyond the count.

**The recall story is stronger.** Dental gives one recurring hook, the six month
cleaning. Veterinary gives several running at once. Annual vaccinations,
quarterly deworming, grooming every four to six weeks.

**The system gets used.** A dental patient books twice a year. A grooming client
books monthly. That shows up directly in whether a day view looks like a business
or a prototype.

**It carries the least regulatory weight.** Pet records are not personal health
information. That matters because the product has a public demo with no login.

## The actual problem

Clinics can already take bookings. They do it over Facebook Messenger and by
phone, and it mostly works.

What they cannot do is remember. A dog vaccinated in March is due next March, and
whether that clinic sees the money depends on whether someone wrote it in a book
and then looked at the book. Most do not. The revenue is already earned and
quietly lost.

Online booking is the surface that gets a clinic to sign up. Recall is why they
stay.

## What has to be true

- A pet owner can book without an account, on a phone, in under a minute.
- Staff can run a full day from one screen without scrolling past it.
- The clinic can see today what is due this week, without asking anyone to remember.
- A stranger evaluating the developer can open it and use it with no account.
- It costs nothing to keep running while nobody is using it.

## What v1 is not

No payments. Philippine clinics take cash and GCash, and v1 records a reference
against a visit rather than processing anything.

No clinical records. Weight, vaccination history and visit notes, not diagnoses
or prescriptions. The moment it holds clinical data it becomes a different
product with a different compliance burden.

No SMS. Reminders are rendered and logged, and the log is visible. Real sending
waits for a paying clinic, because every Philippine gateway charges per message.

No inventory, no billing, no multi-branch. All defensible later. None of them are
why a clinic would sign up.

## How it gets its first user

Build to feature four, which is the point where the product is genuinely
demonstrable, then take it to one clinic from the regional scan before building
anything else. Everything after that is informed rather than assumed.

The offer to that first clinic is not yet decided and needs to be before the
conversation happens. See `decisions.md`.
