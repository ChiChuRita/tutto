# 02 — The Card's news waits for the flip

**What to build:** Draw a Card and you learn which one it is by watching it turn over — not by
reading the sentence underneath it while it is still face-down.

The draw takes about 780ms: 400ms of flight, then a 380ms flip. Today the effect sentence below the
Card renders at t=0, naming the Card in plain German before the flip has revealed anything. The flip
has nothing left to show.

**Blocked by:** 01 — The Roll's news waits for the dice.

**Status:** ready-for-agent

## The second, quieter spoiler

»aufhören« goes grey the instant a forcing Card is drawn, because stopping is not offered under one.
That is 780ms before the Player can see which Card caused it. A dead button is a tell: you know a
Feuerwerk, Plus/Minus or Kleeblatt has arrived before you can read its face.

Both of these are the same fix as ticket 01 — the screen reads the settled position rather than the
live one. This ticket is the Card's half of it.

## What must wait for the flip

- The effect sentence below the Card
- Whether »aufhören« is offered

## What must not wait

The pile's count. A Card leaving the deck is honest — you watched it go — and the count is what the
stack has always shown. It never says *which* Card left, so it gives nothing away (ADR 0003 keeps
the deck as counts precisely so nothing can).

- [x] The effect sentence does not appear until the Card is face-up
- [x] »aufhören« does not change its offered state until the Card is face-up
- [x] The pile's count still updates as the Card leaves it
- [x] Under `prefers-reduced-motion: reduce` both arrive immediately
- [x] A reload mid-draw replays the flight and flip, and the news still follows them
- [x] Nothing reads the deck's contents
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Measured in headless Chrome at 390×844, drawing a Feuerwerk from a Turn that had
just reached a TUTTO under a Bonus (so stopping was on offer beforehand):

| after the draw | before | after |
| -------------- | ------ | ----- |
| 41ms           | sentence already names the Feuerwerk | empty |
| 760ms          | names it | empty |
| 900ms          | names it | names it |

The deck goes 55 → 54 within 40ms in both, and the pile keeps its one edge
throughout — a draw takes a Card out of the deck and lays one on the pile in the
same move, so the depth does not change. Reduced motion: everything at 9ms. A
reload on an already-drawn Card: sentence empty until 900ms.

»aufhören« needed no work. Ticket 01 had already routed it through the settled
position, and the pre-fix tree measures the same as the post-fix one — the
button's own `disabled` flips at ~900ms, not at 41ms. While the draw runs the
whole `fieldset` is off, so a Feuerwerk and a Bonus 500 grey the button
identically and the grey tells you nothing.

The play screen's fold is unchanged: the dice end 198.4px above it, banner up and
four Seats, both before and after. `.card-effect` holds a fixed two lines, so a
longer or shorter sentence cannot move anything.
