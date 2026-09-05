// The privacy notice. RA 10173, the Data Privacy Act of 2012, applies to the
// names, mobile numbers and email addresses Kalinga collects from Philippine
// residents, including in the demo. Plain words, not a wall of legalese.

export const privacy = {
  updated: "5 September 2026",
  intro: "Kalinga is booking and reminder software used by veterinary clinics. This notice explains what we collect, why, how long we keep it, and how to have it deleted. It is written to be read.",
  sections: [
    {
      title: "What we collect",
      body: "When you book, the clinic collects your name, your mobile number, and if you give it, your email address. It also records your pet's name, species, breed and approximate age, and later the dates of vaccinations, deworming and grooming, weight, and a short note from the vet about the visit. Kalinga does not collect payment details. You pay the clinic directly.",
    },
    {
      title: "Why",
      body: "To run the appointment you booked, to confirm it, to remind you when your pet is due for something, and to let the clinic see what was done last time. Nothing else. Your details are not sold, shared with advertisers, or used for anything the clinic did not tell you about.",
    },
    {
      title: "Who holds it",
      body: "The clinic you booked with is the personal information controller. Kalinga processes the data on the clinic's behalf and keeps each clinic's data separate from every other clinic's. Staff at one clinic cannot see another clinic's clients.",
    },
    {
      title: "How long we keep it",
      body: "Real bookings are kept until the clinic deletes them or you ask us to. Demo and sandbox data is deleted automatically within 24 hours and is never used for anything.",
    },
    {
      title: "Where it lives",
      body: "Kalinga runs on cloud infrastructure outside the Philippines, with data encrypted in transit and at rest. If that changes, this notice changes first.",
    },
    {
      title: "Your rights",
      body: "Under the Data Privacy Act you can ask what we hold about you, ask for it to be corrected, ask for it to be deleted, and object to how it is used. You can also complain to the National Privacy Commission. Asking is free and we answer within fifteen days.",
    },
    {
      title: "Cookies",
      body: "Kalinga uses one cookie to keep you signed in and, in the demo, one to remember which sandbox is yours. No tracking, no analytics that identify you.",
    },
  ],
  contact: {
    lead: "To ask for a copy of your data or to have it deleted, use the request form or email us. Say which clinic you booked with and the mobile number you used.",
    email: "privacy@kalinga.example",
  },
} as const;
