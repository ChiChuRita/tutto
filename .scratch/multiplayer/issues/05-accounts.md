# 05 — Accounts

**What to build:** Signing up, signing in and signing out. Sign-up takes an email, a password and
a display name — the display name because head-to-head needs something to print and the provider
gives us only an email.

A signed-in Player taking a Seat types nothing: the Seat is taken under their profile name and
records them as its owner. A guest is unaffected and still plays a full Game without an account.

Authentication is already installed and configured with the email-and-password provider. Use it.
Magic links and third-party sign-in were both considered and rejected — each adds infrastructure
for a path most Players skip entirely.

Nothing about this ticket gates play. Creating a Game, taking a Seat and finishing a Game must
all still work with no account at all.

**Blocked by:** 03 — Joining from the link.

**Status:** done

- [x] A Player can sign up with an email, a password and a display name
- [x] A Player can sign in on another device and be recognised
- [x] A Player can sign out
- [x] A signed-in Player takes a Seat under their profile name without typing one
- [x] A Seat taken by a signed-in Player records its owner; a guest's Seat has no owner
- [x] A guest can still create a Game, take a Seat and play it to the end with no account
- [x] Signed-in and guest Seats can sit in the same Game
- [x] The display name shows wherever Seat names show — lobby, play, result

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
