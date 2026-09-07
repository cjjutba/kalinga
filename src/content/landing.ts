// Marketing copy as typed data, following the portfolio pattern. Positioning
// is Philippine, not generic: pesos, GCash, Messenger, Northern Mindanao named.
//
// The interface previews further down are illustrations of the product, drawn
// with the real components and the real tokens rather than screenshotted. Every
// name in them is invented, as the repository rules require, and none of it
// ever reaches the database.

export const landing = {
  hero: {
    title: "Your clinic's appointment book, off paper. And it remembers.",
    lead: "Kalinga takes bookings on a page you share on Messenger, runs your day from one screen, and tells you which animals are due for a vaccination, deworming or groom. Built for independent vet clinics in Northern Mindanao.",
    primary: { label: "Get started", href: "/sign-up" },
    secondary: { label: "Sign in", href: "/sign-in" },
  },
  /** Three plain facts. Not a logo wall: there are no customers yet. */
  facts: ["Built in Cagayan de Oro", "Free during the pilot", "No per message fees"],
  problem: {
    title: "The revenue you already earned",
    body: "A dog vaccinated in March is due next March. Whether your clinic sees that visit depends on whether someone wrote it in the logbook and then looked at the logbook. Most do not. Kalinga does.",
  },
  pillars: [
    {
      title: "Booking",
      body: "Pet owners book on their phone in under a minute, no account, no app. You share one link on your Facebook page and the appointments arrive in your day.",
      preview: "booking",
    },
    {
      title: "The day",
      body: "One screen runs the morning. Who is coming, who has arrived, who cancelled, who did not turn up. Walk-ins go in without a service until the vet decides.",
      preview: "day",
    },
    {
      title: "Recall",
      body: "Every Monday, every animal due that week, with the message already written. Copy it into Messenger or a text and mark it sent. That is the whole workflow.",
      preview: "recall",
    },
  ],
  recall: {
    title: "Recall is the reason anyone pays",
    body: "Vaccinations are yearly. Deworming is every three months. Grooming is every four to six weeks. Kalinga counts from the last visit and writes the message. The desk sends it the way it already talks to that client.",
  },
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
  },
  faq: [
    { q: "Do my clients need an account?", a: "No. They book with a name and a mobile number. A link on their confirmation lets them change or cancel." },
    { q: "Does Kalinga send the reminders?", a: "Not yet. Every Philippine SMS gateway charges per message, so Kalinga writes the message and you send it the way you already talk to that client. Real sending comes when a clinic asks for it." },
    { q: "Is my clients' data safe?", a: "Names and mobile numbers are personal information under the Data Privacy Act. Kalinga keeps them only for the clinic that collected them, encrypts them in transit and at rest, and has a working route for deletion requests." },
    { q: "What about medical records?", a: "Kalinga holds weight, vaccination and deworming dates and visit notes. Not diagnoses, not prescriptions. It is a booking and recall tool, not a clinical record." },
  ],
  closer: {
    title: "Take your first booking this week",
    body: "Setting a clinic up takes about ten minutes. Nothing to install, nothing to pay for.",
  },
} as const;

// The invented clinic the interface previews show. Fictional, per the
// repository rules: no clinic name, address or number here belongs to anyone.
export const preview = {
  clinic: "Lunhaw Animal Clinic",
  day: {
    label: "Today, Monday 7 September",
    days: [
      { day: "Sun", date: "6" },
      { day: "Mon", date: "7", today: true },
      { day: "Tue", date: "8" },
      { day: "Wed", date: "9" },
      { day: "Thu", date: "10" },
      { day: "Fri", date: "11" },
      { day: "Sat", date: "12" },
    ],
    rows: [
      { time: "9:00 AM", pet: "Kiko", owner: "Maria Villanueva", service: "Vaccination", status: "arrived" },
      { time: "9:30 AM", pet: "Bella", owner: "Josefa Ramirez", service: "Deworming", status: "confirmed" },
      { time: "10:15 AM", pet: "Tisoy", owner: "Ernesto Bacala", service: "Consultation", status: "confirmed" },
      { time: "11:00 AM", pet: "Muning", owner: "Liza Ompoc", service: "Grooming", status: "booked" },
    ],
  },
  booking: {
    service: "Vaccination, 30 minutes",
    day: "Monday 7 September",
    slots: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
    chosen: "9:30 AM",
  },
  due: [
    { pet: "Kiko", breed: "Aspin", kind: "Vaccination", when: "Due today" },
    { pet: "Muning", breed: "Puspin", kind: "Grooming", when: "Due in 3 days" },
    { pet: "Bella", breed: "Aspin", kind: "Deworming", when: "Overdue" },
  ],
  message: {
    pet: "Kiko",
    breed: "Aspin",
    owner: "Maria Kristina Angelica de los Santos Villanueva",
    mobile: "0917 555 0101",
  },
} as const;
