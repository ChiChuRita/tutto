# 08 — Who is still here

**What to build:** You can see which Players still have the Game open. A Seat whose device has
checked in recently shows as present; one that has not shows as away. In a Game that may span days,
this is the difference between "she is thinking" and "she went to bed".

**Blocked by:** None — the multiplayer tickets it builds on are all merged.

**Status:** done

## Keep it cheap

A heartbeat is enough. The seated device says "still here" every so often, and a Seat counts as
present if its last check-in is recent. No sockets, no presence service, no new dependency.

**Suggested numbers, not sacred:** check in every 10 seconds, count a Seat as present if it checked
in within the last 30. Slow enough to be nearly free, fast enough that "away" means something.

**Only while the tab is visible.** A backgrounded tab has its timers throttled by the browser
anyway, and a Player who has switched to another app is not present in any sense a table-mate cares
about. Stop the heartbeat when the page is hidden and resume when it comes back.

## The one thing that must not be got wrong

**The heartbeat does not go on the Game document.** Every device at the table subscribes to that
document, so a timestamp written into it every few seconds would re-render every phone several times
a minute and interleave with real moves. It belongs in its own table keyed by Game and Seat, queried
by index — the same shape the Seat secrets already use, and for the same reason.

A Seat proves the heartbeat is its own the way it proves everything else: with the secret the device
holds (ADR 0004). A device with no Seat cannot check in for one.

## What it looks like

The scoreboard is collapsed behind a tap, so the full picture belongs in the modal: every Seat,
present or away. The **collapsed row shows presence for the Seat whose Turn it is** — that is the
one you care about at a glance, because it answers "is anyone going to move?".

Away is a quiet state, not an alarm. Nobody is being kicked and nothing is being blocked: a Turn is
never skipped, and a stalled Game is abandoned deliberately by a Player (ADR 0005).

Presence is per **Seat**, not per User — a guest is tracked exactly like an account, because the Seat
is what plays.

## Out of scope

Spectators are not tracked; they hold no Seat and nobody is waiting on them. Nothing is tracked for
a Game that is over or abandoned. There is no "last seen 20 minutes ago" — present or away is the
whole vocabulary.

- [x] A seated device checks in periodically while its tab is visible, and stops when it is hidden
- [x] Every Seat in the modal shows as present or away
- [x] The collapsed scoreboard row shows presence for the Seat whose Turn it is
- [x] A Seat that stops checking in becomes away within the threshold, on every other device
- [x] A Player returning to the tab becomes present again without a reload
- [x] Check-ins are stored outside the Game document and queried by index, so a heartbeat never
      re-renders the table
- [x] A device cannot check in for a Seat it does not hold
- [x] Guests and signed-in Players are tracked identically
- [x] Nothing is tracked for a finished or abandoned Game, and Spectators are not tracked
- [x] Presence never blocks, skips or ends a Turn
- [x] No new dependency
- [x] The reducer stays out of it: presence is not part of the Game's position

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
