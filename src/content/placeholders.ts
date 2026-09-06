// Every placeholder in the product, in one place.
//
// Two rules hold it together. The same field always shows the same hint, so a
// mobile number looks the same on the booking page as it does at the desk. And
// nothing here is a name: no invented people, clinics, streets or numbers that
// could be read as real ones. A placeholder shows the shape of the answer, not
// an example of a person.

export const placeholder = {
  /** Any person: a client, a member of staff, whoever is booking. */
  personName: "First and last name",
  petName: "The name you call them",
  clinicName: "Your clinic's name",
  /** Naming somebody else's clinic, on the deletion request form. */
  theirClinicName: "The clinic's name",

  /** Your own address. */
  email: "you@example.com",
  /** Somebody else's, on a form where you are entering it for them. */
  contactEmail: "name@example.com",
  mobile: "09XX XXX XXXX",
  mobileOrEmail: "09XX XXX XXXX or you@example.com",

  password: "Enter your password",
  newPassword: "At least 10 characters",

  city: "Your city",
  address: "Street, building or landmark",
  bookingAddress: "your-clinic",

  serviceName: "What you call it",
  minutes: "30",
  buffer: "0",
  price: "500",
  weeks: "5",
  weightKg: "8.5",
  paymentRef: "The reference number",

  /** Free text, one field at a time, so each says what belongs in it. */
  clientNotes: "Anything the desk should remember",
  vetNotes: "What you found and what you did",
  visitAdministered: "Vaccine, dose, anything given",
  appointmentNote: "Allergies, behaviour, what to watch for",
  reason: "A sentence is enough",
  closureReason: "Fiesta, stocktake, staff leave",

  /** Search boxes say what can be typed into them. */
  searchClients: "Name, mobile or email",
  searchPets: "Pet, breed or owner",
  searchAudit: "Cancelled, booked, a pet's name",
  searchPetOrOwner: "Search by pet, owner or mobile",
} as const;
