# 06 — Claiming your guest history

**What to build:** A guest who has been playing for weeks signs up, and the Games they already
played become theirs. The device already holds a secret for every Seat it has taken, so signing
up offers them all and takes ownership of the Seats that are still unowned.

Say the limit plainly on screen at the moment it matters: this covers the Games played on this
device. There is no way to prove that a guest on one phone was the same person as a guest on
another, and inventing one is out of scope.

Claiming is retroactive and needs no backfill — anything derived from Seat ownership simply
starts counting those Games.

**Blocked by:** 05 — Accounts.

**Status:** done

- [x] Signing up claims every unowned Seat this device holds a secret for
- [x] Claimed Seats show the new profile name wherever Seat names show, including in Games that
      already finished
- [x] A Seat already owned by another User is never taken over
- [x] Games played on another device are not claimed, and the screen says so before the Player
      expects otherwise
- [x] Signing in on a device that has guest Seats claims those too, not only fresh sign-ups
- [x] Claiming works for Games in progress as well as finished ones, and does not disturb a Game
      that is mid-Turn

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
