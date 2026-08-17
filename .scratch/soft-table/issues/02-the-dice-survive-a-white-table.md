# 02 — The dice survive a white table

**What to build:** Six near-white dice, still reading as objects lying on a table, when the table is
also near-white.

**Blocked by:** `01 — The table turns light`

**Status:** ready-for-agent

## Why this is its own ticket

`--color-die` is `#fafafa` and the new ground is `#fefefe`. That is **1.02:1**. On the old charcoal
table the dice were the brightest thing in the room and needed nothing but their pips; on a white one
they are very nearly invisible, and the app's most important object becomes a hole in the page.

This is the single biggest risk in the whole redesign, which is why it is the slice immediately after
the ground rather than a line inside it. `01` may land with this unresolved; it may not ship with it
unresolved.

## What might solve it — pick one and say why

- **A contact shadow and a soft edge.** A die is a physical object; the honest fix is the shadow it
  casts and a hairline of its own darker tone. Cheapest, and it keeps the die white.
- **A tinted playing area.** A pale wash behind the hand — the felt, in effect — so the dice sit on
  something. Costs a new surface but gives the play screen a centre.
- **A warmer die.** Move `--color-die` off white towards cream so it separates from the paper.

Not a menu to implement all of: choose, measure, and record what was rejected.

## What must not break

- **The reserved sweep.** `--die-box` is `1.8 × --die-size` and it is what stops dice painting over
  one another. A shadow or an edge that grows the die's painted extent spends it — **re-measure
  clearance the way `real-table 02` and `07` did**, every frame, and report the number against the
  current 3.50px.
- **The pips.** `--color-ink` on the die has to keep clearing 4.5:1, and so does a picked-up die's
  azure ground.
- **Three die states stay three.** In hand, picked up (azure), set aside (spent). Whatever separates
  the die from the table must not blur those.
- **Reduced motion** is untouched: this is the die's appearance, not its movement.
- The dice on the Straße Card are the same drawing (`DieFace`) — check they still read on a Card face
  as well as on the table.
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [ ] A die at rest on the light table reads as an object, not as a gap
- [ ] The three die states are still instantly distinguishable
- [ ] Pips clear 4.5:1 in every state, numbers reported
- [ ] Clearance re-measured every frame at 390×844 / 375×667 / 375×553 / 320×844, reported against 3.50px
- [ ] No die is smaller and `--die-box` is unchanged
- [ ] The six dice on the Straße Card still read
- [ ] The approach chosen is recorded with what was rejected and why
