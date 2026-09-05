# Roles

Four roles. Three of them work inside the clinic and one is the customer.

This is deliberately one more than the three role-scoped portals in the author's
client work, and unlike that project a stranger can open this one and switch
between all four.

## Owner

Runs the business. Sees everything the clinic holds.

Staff accounts and their permissions. Services, prices and durations. Working
hours and closures. Every appointment and every record. The audit trail. Whatever
reporting exists.

The only role that can remove data or change what other people can reach.

## Vet

Sees their own day and the animals in it.

Their column of the schedule. Full records for any pet in the clinic, because
they may cover for a colleague. Adds visit notes, weight and vaccination dates,
which is what feeds recall.

Cannot change staff, prices, or hours. Cannot see the audit trail.

## Front desk

Runs the day. The role that touches the system most.

The full schedule for every vet. Book, reschedule, cancel and mark arrived.
Handle walk-ins. Create and edit owner and pet contact details. Work the recall
queue, which means seeing what is due and sending the message.

Cannot see or edit visit notes beyond what a booking needs, cannot change staff
or prices, cannot delete records.

## Pet owner

The customer. Reaches almost nothing, which is the point.

Books without an account. Sees their own pets, their own upcoming appointments,
and their own history. Receives recall reminders. Cancels or reschedules their
own booking.

Never sees another owner's animals, the clinic's schedule as a whole, or anything
belonging to staff.

## How this is enforced

Server side, every time. Hiding a button is not a permission.

Each role gets a test asserting what it **cannot** reach, including by guessing a
URL. F6 is not done until a front desk account is provably unable to open
owner-only data.

Roles are scoped to an organisation. A person who works at two clinics has two
memberships and two sets of permissions, and neither one leaks into the other.
