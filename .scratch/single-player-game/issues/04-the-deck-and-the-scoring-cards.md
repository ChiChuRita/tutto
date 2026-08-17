# 04 — The deck and the scoring Cards

**What to build:** Cards enter the game. A Card is drawn face-up at the start of every Turn and
again after every Tutto the Player chooses to continue from — which is what makes continuing a real
gamble, because the next Card might be a Stop.

Three Card types work in this ticket: Bonus, which adds its points only if the Turn ends on a
Tutto; x2, which doubles the whole Turn score on a Tutto; and Stop, which ends the Turn immediately
with nothing. Bonus and x2 still let a Player bank their rolled points if they stop without a
Tutto — they simply lose the bonus.

Per ADR 0003 the deck is stored as counts of each Card type remaining, not a shuffled order, and a
draw picks weighted-randomly from what is left. Exhausting the counts resets them to the full
56-Card distribution, which is the reshuffle. Card counting stays a real strategy, so the number of
Cards left has to be visible.

The remaining four Card types are deliberately out of scope here — they change turn control flow
and depend on Seats and game-end, which do not exist yet.

**Blocked by:** 02 — Play one Turn

**Status:** done

- [x] A Card is drawn at the start of each Turn and shown face-up with its effect in German
- [x] Continuing after a Tutto draws a new Card before the six dice are rerolled
- [x] Bonus adds its points only when the Turn ends on a Tutto
- [x] Stopping without a Tutto still banks the rolled points, without the bonus
- [x] x2 doubles the whole Turn score when the Turn ends on a Tutto
- [x] A Stop Card ends the Turn immediately and banks nothing
- [x] The deck holds exactly 25 Bonus (5 each of 200/300/400/500/600), 10 Stop, 5 Fireworks, 5 Straight, 5 Plus/Minus, 5 x2, and 1 Cloverleaf
- [x] Drawing reduces the remaining count for that Card type
- [x] The deck reshuffles to the full distribution when exhausted
- [x] The number of Cards remaining is visible to the Player
- [x] No representation of the deck's future ordering exists anywhere
- [x] Tests cover Bonus with and without a Tutto, x2, Stop, and deck exhaustion

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
