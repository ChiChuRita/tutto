# 03 — Overtaking is something you watch

**What to build:** When your score carries you past somebody, the two rows swap places. Taking the
lead stops being a fact you notice and becomes a moment you see.

**Blocked by:** 02 — The leaderboard: three ranked rows. There is nothing to swap until the rows are
ranked.

**Status:** ready-for-agent

## The number moves the row

Scores already count through their values rather than jumping. **A row changes position at the
moment its counting number crosses its neighbour's** — so the swap is visibly *caused* by the
count, rather than happening alongside it.

A row that moved before the number that moved it would read as the app knowing something it has not
shown you yet, which is the thing three tickets in this project have gone to some trouble to
prevent.

## The animation is the library's job

Given stable keys and a changed order, the motion library animates a reorder itself. Do not invent a
module to describe a movement something else already performs.

This is the **first layout animation in the app**. An earlier ticket deliberately added none —
nothing changed place then, and inventing movement would have been a visible change nobody asked
for. Something changes place now, so that reason has expired. Note it where the motion vocabulary
lives, so the next reader does not think it slipped in.

## What must hold

- **A watching Player sees the swap at the same moment**, from the same subscription.
- **It waits for the dice.** A swap is the most eye-catching outcome this screen has ever had, and
  it must not appear over dice still in the air.
- **Nothing else shifts.** The rows exchange places; the screen around them does not move.
- **Reduced motion**: the rows are simply in their new order, the numbers simply their new values.
  One mechanism, the hook that already exists.
- The play screen still fits the phone. Measure it and report.

- [ ] A score that overtakes another swaps the two rows
- [ ] The swap happens as the counting number crosses its neighbour's, not before
- [ ] A watching Player sees the swap at the same point
- [ ] A swap never appears while the dice that caused it are still moving
- [ ] Nothing outside the rows shifts position during a swap
- [ ] Reduced motion gets the new order with no movement
- [ ] The swap is the library's reorder, not a hand-rolled one
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
