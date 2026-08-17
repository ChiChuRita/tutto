# 06 — The forcing Cards

**What to build:** The four Cards that take the choice away from the Player, after which all seven
Card types work and the ruleset is complete.

**Fireworks** forces rolling until a Niete, with no option to stop. A Tutto under Fireworks
continues without drawing a new Card — the Card stays in force. When the Turn finally ends on a
Niete the Player still banks everything rolled, so the forced ending is not itself a punishment.

**Plus/Minus** requires a Tutto with no option to stop. Succeeding scores exactly 1000 regardless
of what was rolled, and deducts 1000 from the leading Seat. Every tied leading Seat loses 1000
while the rolling Seat still gains 1000 only once. No score falls below zero. A leading Seat that
draws this Card deducts nothing from itself.

**Straight** replaces the rule for what counts as a valid die: any number not yet set aside.
Completing 1 through 6 scores 2000 and counts as a Tutto, so the Player may continue. A Roll
containing no new number is a Niete.

**Cloverleaf** requires two consecutive Tuttos with no option to stop. Succeeding ends the Game
immediately as a win at any score.

This ticket sits behind Seats and game-end because Plus/Minus targets the leading Seat and
Cloverleaf ends the Game — neither is expressible before those exist.

**Blocked by:** 05 — Seats, 6000, and the Final round

**Status:** done

- [x] Fireworks forces continued rolling until a Niete, with no stop option offered
- [x] A Tutto under Fireworks continues without drawing a new Card
- [x] A Fireworks Turn ending on a Niete still banks every point rolled during it
- [x] Plus/Minus offers no stop option and scores nothing on a Niete
- [x] A successful Plus/Minus scores exactly 1000 regardless of the points rolled
- [x] A successful Plus/Minus deducts 1000 from the leading Seat
- [x] Every tied leading Seat loses 1000, while the rolling Seat gains 1000 only once
- [x] A leading Seat drawing Plus/Minus deducts nothing from itself
- [x] No Seat's score ever falls below zero
- [x] Straight treats a die as valid when its number has not yet been set aside, replacing the normal table
- [x] A completed Straight scores 2000, counts as a Tutto, and allows continuing
- [x] A Straight Roll containing no new number is a Niete
- [x] Cloverleaf offers no stop option and requires two consecutive Tuttos
- [x] A completed Cloverleaf ends the Game immediately as a win at any score, including mid-Final-round
- [x] Each of the four Cards is tested in both its success and its failure branch

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
