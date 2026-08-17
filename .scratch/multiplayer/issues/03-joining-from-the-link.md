# 03 — Joining from the link

**What to build:** Send a Game's URL to a second phone. It opens the lobby, sees who is already
seated, types a name and takes a Seat. Both phones see the Seat list update live. The creator
starts, and the two play the Game together.

This is the first point where two people are really in one Game, so it is also the point where a
Seat has to belong to somebody. Taking a Seat mints a secret that the browser keeps; every
mutation that acts on a Seat carries it and refuses one that does not match. A refresh keeps your
Seat because the secret is still there. Clearing site data loses it, and that is accepted.

The link is the Game's URL and nothing more. It grants no Seat by itself — taking one is a
deliberate act on arrival. Write that up as an ADR, together with the consequence: the secret is
a bearer credential, so whoever holds the link _and_ takes the Seat is that Seat, and a Seat
cannot be recovered on a different device.

**Blocked by:** 02 — Named Seats and the lobby.

**Status:** done

- [x] Opening a Game's URL on a second device shows that Game's lobby with the existing Seats
- [x] Taking a Seat from the second device adds it to the Seat list on both devices without a
      reload
- [x] A duplicate name is refused across devices, not just within one
- [x] A device that has taken a Seat sees itself as seated when it reopens the link, and is not
      offered a second Seat
- [x] Refreshing keeps your Seat
- [x] A mutation acting on a Seat is refused when the caller's secret does not match that Seat
- [x] A device holds its secrets per Seat across several Games at once
- [x] Two devices can play a Game through to a finish, alternating Turns
- [x] An ADR records that the Invite link identifies the Game rather than a Seat, its rejected
      alternative, and the device-only limit that follows

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
