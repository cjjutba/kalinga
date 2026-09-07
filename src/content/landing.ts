// Marketing copy as typed data, following the portfolio pattern. Positioning
// is Philippine, not generic: pesos, GCash, Messenger, Northern Mindanao named.

export const landing = {
  hero: {
    title: "Your clinic's appointment book, off paper. And it remembers.",
    lead: "Kalinga takes bookings on a page you share on Messenger, runs your day from one screen, and tells you which animals are due for a vaccination, deworming or groom. Built for independent vet clinics in Northern Mindanao.",
    primary: { label: "Get started", href: "/sign-up" },
    secondary: { label: "Sign in", href: "/sign-in" },
  },
  problem: {
    title: "The revenue you already earned",
    body: "A dog vaccinated in March is due next March. Whether your clinic sees that visit depends on whether someone wrote it in the logbook and then looked at the logbook. Most do not. Kalinga does.",
  },
  pillars: [
    {
      title: "Booking",
      body: "Pet owners book on their phone in under a minute, no account, no app. You share one link on your Facebook page and the appointments arrive in your day.",
    },
    {
      title: "The day",
      body: "One screen runs the morning. Who is coming, who has arrived, who cancelled, who did not turn up. Walk-ins go in without a service until the vet decides.",
    },
    {
      title: "Recall",
      body: "Every Monday, every animal due that week, with the message already written. Copy it into Messenger or a text and mark it sent. That is the whole workflow.",
    },
  ],
  local: {
    title: "Made for how clinics here already work",
    points: [
      "Prices in pesos, payments in cash or GCash. No card gateway, no per message fees.",
      "Reminders go out through whatever you already use with that client. Kalinga writes them, you send them.",
      "Times in Philippine time, labelled, even for someone booking from abroad for their parents' dog.",
      "Aspin and puspin are breeds here, not \"mixed\".",
    ],
  },
  pricing: {
    title: "Free during the pilot",
    body: "The first clinics in Cagayan de Oro, Iligan and around Northern Mindanao use Kalinga free while it is being finished with them. After that, one flat monthly fee in pesos. No per booking charge, no per message charge, no contract.",
    cta: { label: "Talk to us about a pilot", href: "mailto:hello@kalinga.example" },
  },
  faq: [
    { q: "Do my clients need an account?", a: "No. They book with a name and a mobile number. A link on their confirmation lets them change or cancel." },
    { q: "Does Kalinga send the reminders?", a: "Not yet. Every Philippine SMS gateway charges per message, so Kalinga writes the message and you send it the way you already talk to that client. Real sending comes when a clinic asks for it." },
    { q: "Is my clients' data safe?", a: "Names and mobile numbers are personal information under the Data Privacy Act. Kalinga keeps them only for the clinic that collected them, encrypts them in transit and at rest, and has a working route for deletion requests." },
    { q: "What about medical records?", a: "Kalinga holds weight, vaccination and deworming dates and visit notes. Not diagnoses, not prescriptions. It is a booking and recall tool, not a clinical record." },
  ],
} as const;
