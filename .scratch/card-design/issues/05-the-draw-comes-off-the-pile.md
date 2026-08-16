# 05 — The draw comes off the pile

**What to build:** Drawing a Card becomes an event you watch. The Card lifts off the pile — the
real pile, wherever it happens to be on screen — travels to its place, and turns over.

**Blocked by:** 04 — Real Cards.

**Status:** ready-for-agent

## Measured, not guessed

The first implementation animated from a **fixed offset**, which is why it does not read as coming
off the pile, and why it is visibly wrong when the »letzte Runde« banner shifts the layout down.

Measure instead: take the pile's and the slot's real positions at draw time and animate between
them. Then travel, then turn over — two beats, not one compound move. It must be right under any
layout, banner or no banner.

## The one new piece of logic

The geometry is a **pure function** and it is the seam this ticket is tested at: given the pile's
rectangle and the slot's rectangle, return the offset and scale the flight starts from. It mirrors
the shape of `dice.ts`'s `startRotation`, which takes a face and a seed and returns where a tumble
begins.

It has real cases worth testing: the pile above the slot and beside it, the banner shifting the slot
down, and a rectangle that has not been measured yet.

## Everything else

Mount-keyed, as the dice are: a new Card mounts a new element and that is what starts the
animation, so a reload replays it. After a TUTTO the spent Card gives way to the new one.

Nothing may be clipped — not the Card in flight, not by the slot, the stat row, or the page.

Reduced motion disables both beats, through the library's hook.

Animation stays a replay: the server chose the Card (ADR 0001), and nothing here may reach for the
deck's contents (ADR 0003).

- [ ] The draw animates from the pile's measured position to the slot's measured position
- [ ] The Card turns over on arrival, as a second beat after the travel
- [ ] The draw is correct with the »letzte Runde« banner on screen
- [ ] The draw geometry is a pure function with its own tests, covering the pile above and beside
      the slot, the banner case, and an unmeasured rectangle
- [ ] The Card in flight is never clipped
- [ ] After a TUTTO the spent Card gives way to the new one
- [ ] Both beats are disabled under `prefers-reduced-motion: reduce`
- [ ] Nothing reads the deck's contents
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
