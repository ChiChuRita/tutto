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

- [ ] The effect sentence does not appear until the Card is face-up
- [ ] »aufhören« does not change its offered state until the Card is face-up
- [ ] The pile's count still updates as the Card leaves it
- [ ] Under `prefers-reduced-motion: reduce` both arrive immediately
- [ ] A reload mid-draw replays the flight and flip, and the news still follows them
- [ ] Nothing reads the deck's contents
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
