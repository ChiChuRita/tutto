# 13 — Scores count, they do not jump

**What to build:** When points are won or lost, the number moves through the values rather than
being replaced. Banking 1150 counts up to it; a Plus/Minus taking 1000 off the leaders counts them
down. You see the size of what happened, not just the result.

**Blocked by:** `no-spoilers` 01 — The Roll's news waits for the dice. A score that starts counting
while the dice are still in the air announces the outcome before the Roll lands, which is exactly
what that work exists to stop.

**Status:** ready-for-agent

## Why

A number that swaps from 4200 to 5350 tells you the new total. A number that runs up through the
gap tells you that you just made 1150 — which is the part worth feeling. It costs nothing in
layout, and it is the cheapest physicality in the whole game.

This is the same idea as ticket 10's draining Turn score on a Niete, applied to every score that
moves. If both are built, they should share one mechanism rather than each rolling their own.

## Where it applies

- A Seat's score when a Turn is banked
- Every Seat's score a **Plus/Minus** moves — it pays the Player 1000 and takes 1000 off the
  leaders, and watching several numbers fall at once is the whole character of that Card
- The »Im Zug« Turn score as dice are set aside

## What it must not do

- **Not shift anything.** Digits change width, so the number must not resize the tile as it counts —
  the play screen holds fixed heights and stable geometry everywhere.
- **Not be slow.** This is a flourish between taps. A long count is a delay, and the Player is
  waiting to act.
- **Not fight the settled position.** The count starts when the news arrives, which is when the dice
  have landed — never before.
- **Not announce early.** A count that begins the instant the server answers would leak the outcome
  under the tumbling dice.

Reduced motion: the number changes at once, no counting.

- [ ] A banked Turn counts the Seat's score up to its new total
- [ ] A Plus/Minus counts the Player up and the leaders down
- [ ] The »Im Zug« score counts as dice are set aside
- [ ] Counting begins only once the dice have settled
- [ ] No tile resizes and nothing shifts while a number counts
- [ ] It is quick enough not to delay the next tap
- [ ] Reduced motion changes numbers at once
- [ ] If ticket 10 is built, the drain and the count share one mechanism
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
