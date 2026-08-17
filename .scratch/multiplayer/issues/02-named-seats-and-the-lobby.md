# 02 — Named Seats and the lobby

**What to build:** A new Game opens in a lobby rather than straight into play. You give yourself
a name, see yourself in the Seat list, and tap »Los geht's« to begin. Seats stop being »Platz 1«
and carry their names from here on — in the lobby, during play, and on the result screen.

The name you used is remembered on the device and offered back the next time you take a Seat, so
a second Game is one tap.

Still a single device. Solo play survives: create, name yourself, start with one Seat, play a
full Game to the end.

The lobby belongs in the reducer, not in the mutations. Take-a-Seat and start join the existing
events, and a Seat gains a name and a nullable owner alongside its score and turn count. The
owner stays unset for now — it is what a later ticket fills in. Keep the reducer free of imports:
the owner is an opaque string there, never a database id type.

**Blocked by:** 01 — A Game has a URL.

**Status:** done

- [x] A newly created Game is in a lobby, not in play
- [x] Taking a Seat requires a name and adds you to the Seat list
- [x] The Seat list shows everyone seated, in join order
- [x] A name already taken in this Game is refused, with the reason shown
- [x] The same name in a different Game is allowed
- [x] The last name used is offered as the default the next time you take a Seat
- [x] Starting the Game moves it from lobby into play, in join order
- [x] A Game cannot be started with no Seats
- [x] A Game with a single Seat can be started and played through to a finish
- [x] Seat names replace »Platz N« during play and on the result screen
- [x] The lobby rules are covered by reducer tests alongside the existing ones — no new test
      framework, no mocking, no Convex in the test

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
