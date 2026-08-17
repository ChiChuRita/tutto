# 03 — Overtaking is something you watch

**What to build:** When your score carries you past somebody, the two rows swap places. Taking the
lead stops being a fact you notice and becomes a moment you see.

**Blocked by:** 02 — The leaderboard: three ranked rows. There is nothing to swap until the rows are
ranked.

**Status:** ready-for-agent

## The number moves the row

Scores already count through their values rather than jumping. **A row changes position at the
moment its counting number crosses its neighbour's** — so the swap is visibly _caused_ by the
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

- [x] A score that overtakes another swaps the two rows
- [x] The swap happens as the counting number crosses its neighbour's, not before
- [x] A watching Player sees the swap at the same point
- [x] A swap never appears while the dice that caused it are still moving
- [x] Nothing outside the rows shifts position during a swap
- [x] Reduced motion gets the new order with no movement
- [x] The swap is the library's reorder, not a hand-rolled one
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## How the number moves the row

`leaderboard` in `src/scoreboard.ts` ranks on the numbers **being shown** rather than on the settled
scores behind them. The counts are lifted out of the rows into `useCounts` (`src/useCount.ts`), one
clock over every Seat's score, so the ordering has them all on every frame. The rows then change
place on the step a count passes its neighbour — level is not past, because a tie breaks on the Seat
as it does everywhere else, so a row crossing does not flicker on the step it lands level.

The numbers counted are the settled position's, which is what `Scoreboard` has always been handed,
so no part of this can appear over dice still in the air.

## The library's reorder

The rows were already keyed by Seat, so `layout` on each row is the whole of the animation:
`ROW_SWAP` in `src/motion.ts` is the only thing added, and it carries why this is the app's first
layout animation and why the earlier ticket's reason for having none has expired.

It costs a feature set. `LazyMotion` now loads `domMax` rather than `domAnimation` — layout
animation is not in the smaller bundle — and that is stated at the import in `src/App.tsx` rather
than swapped in quietly. The same bundle brings drag, which nothing uses.

Reduced motion is `layout={!still}`: the feature is absent rather than the duration set to nothing,
and `useCounts` hands back the settled numbers outright, so the rows are simply in their new order.

## What the browser measured

Real headless Chrome over CDP, the same worst case ticket 02 measured: four Seats, the »letzte
Runde« banner up, an effect over two lines, six dice on the table and six set aside, this device
holding the Seat whose Turn it is.

| viewport | rows | scoreboard | needs | spare | scrolls |
| -------- | ---- | ---------- | ----- | ----- | ------- |
| 390×844  | 3    | 82.0       | 829.3 | +14.7 | no      |
| 412×915  | 3    | 82.0       | 829.3 | +85.7 | no      |
| 390×800  | 3    | 80.2       | 789.6 | +10.4 | no      |
| 390×799  | 1    | 47.4       | 755.9 | +43.1 | no      |
| 390×754  | 1    | 46.8       | 716.6 | +37.4 | no      |
| 375×667  | 1    | 45.6       | 640.6 | +26.4 | no      |
| 375×600  | 1    | 44.7       | 582.0 | +18.0 | no      |
| 375×553  | 1    | 44.1       | 544.5 | +8.5  | no      |

Every figure is ticket 02's to the tenth, in both regimes: the swap costs no layout.

The swap itself, three Seats and Cem banking 1000 from 50 onto 1050, past Anna's 1000 and short of
Bernd's 1100, sampled every frame: the rows hold their order at 950 and at 1000 — level is not past
— and start moving on the frame the number reads 1050. Bernd's row never moves. The scoreboard's
top and height, the last button on the screen, the column's height and `scrollHeight` are constant
through the whole of it.

On two devices at once, the Seat that banked and someone watching who holds no Seat: both count in
step, both cross at the same sample and both swap together, off one published position. Under
`prefers-reduced-motion` the rows are in their new order with their new numbers within a frame, with
no transform on any of them.

Only a human can settle whether that reads as an overtake rather than a glitch — and, at four Seats,
whether the window sliding as you climb (a row leaving the bottom as another arrives at the top, at
the moment your number crosses) reads as part of the same event.

## Comments

**The one clock is now one clock.** The lane lifted the counts out of the leaderboard rows but left
`<Counting>` on every Seat in the scores dialog, which is always mounted — so at four Seats a bank
ran five rAF loops where it had run four. Every Seat's score on this screen now reads out of the one
`useCounts`: the ranked rows, this device's score in the collapsed row, and the full table behind the
tap. One loop per bank at any number of Seats, in either regime, and nothing counts a number twice.
What it costs is that `Scoreboard` re-renders per frame of a count rather than each number
re-rendering itself — a row of text and a shut dialog's list against five separate numbers.

**What the feature set costs, measured.** `npm run build`, the one word in `App.tsx` changed and
nothing else:

| features       | raw       | gzipped   |
| -------------- | --------- | --------- |
| `domAnimation` | 393.16 kB | 122.64 kB |
| `domMax`       | 439.91 kB | 135.99 kB |

**+46.75 kB raw, +13.35 kB gzipped** for one movement, once a Turn at the most — very nearly all of
what moving to `LazyMotion` banked in the first place. It brings `drag` along too, which nothing
uses. The figure is at the import in `App.tsx` and beside `ROW_SWAP` in `motion.ts`, not only here.
