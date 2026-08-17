# 05 — Seats, 6000, and the Final round

**What to build:** The Game gains an ending, and the ending is the official one rather than the
obvious one. Reaching 6000 does **not** win. It opens the Final round: play continues until every
Seat has taken an equal number of Turns, and then the highest score wins. The Seat that crossed
6000 first can lose.

The reducer starts handling any number of Seats here, even though the UI still creates a Game with
one. This is deliberate: the equalising rule and the leading-Seat rule that arrives in the next
ticket are inert with a single Seat and would ship untested. Multi-Seat state costs almost nothing
now and avoids reshaping the core when Invite links eventually arrive.

Turn order is join order and the host goes first. With equal Turn counts that is fair, so it needs
no configuration.

A result screen ends the Game, naming the winner and showing final scores.

**Blocked by:** 04 — The deck and the scoring Cards

**Status:** done

- [x] The reducer's state holds an array of Seats, each with its own score and turn count
- [x] Play passes to the next Seat in order when a Turn ends, by any means
- [x] A Seat reaching at least 6000 opens the Final round rather than ending the Game
- [x] During the Final round, remaining Seats take Turns until every Seat's Turn count is equal
- [x] The Game then ends and the highest score wins, even if that is not the Seat that crossed 6000 first
- [x] A result screen names the winner and shows every Seat's final score, in German
- [x] The UI still creates and plays a Game with a single Seat
- [x] Tests cover a multi-Seat Final round in which the Seat that crossed 6000 first does not win
- [x] Tests cover turn rotation and the equal-turn-count end condition

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
