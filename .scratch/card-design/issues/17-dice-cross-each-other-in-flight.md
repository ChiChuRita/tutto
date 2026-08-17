# 17 — Dice cross each other on their way to »Herausgelegt«

**What to build:** Fix dice overlapping mid-flight when several are set aside at once. This closes the
one acceptance criterion in `card-design 09` that has been open since it shipped — and it is open
because it was never true.

**Blocked by:** None — can start immediately.

**Status:** done

## What was measured

The restyle lane probed the flight and found dice **overlapping by about 20px mid-flight whenever the
tap order is not the grid order**. The row fills in tap order and the berths are laid out
left-to-right, so picking the third die and then the first sends two dice across each other's paths.

It is **pre-existing** — the probe reproduced it against the original eased tween as well as the new
spring, because the paths are the same either way: same start, same end, same duration. The spring
did not cause it and does not make it worse. The spring's own overshoot is 5.3px against an 8px gap,
which cannot put one die inside another.

This is the same class of defect as the bug that once looked like clipping: `.die` carries
`perspective`, so every die is its own flattened stacking context and siblings can never interleave
in 3D. When two dice cross, the later one paints its opaque faces flat over the other along a hard
edge.

## What a fix has to respect

- **Every die must still arrive in the right berth.** The row's order is the order they were set
  aside in, and that is correct — it is what the Player did.
- **The reserved sweep is untouchable.** Each die's box is `1.8 × --die-size` for the room its cube
  needs while tumbling, and no fix may buy space from it.
- **Nothing may shift**, and the flight must still be transform-only out of a berth the row already
  holds.
- **Reduced motion** still has no flight at all.
- The play screen still fits: 390×844, 375×667, 375×553.

Options worth weighing rather than assuming: staggering the departures so crossing dice are never in
the air together; routing each die so paths do not intersect; or letting the row's berths take the
grid's order rather than the tap order, so nothing has to cross. The last changes what the row means
and is the one to think hardest about.

## Verify it the way it was found

Still frames prove nothing here — the phases the dice rest in were measured at ten viewports and
looked fine. **Capture partway through the flight**, with a tap order that is not the grid order,
which is the case that fails.

- [x] Two dice set aside in an order that is not left-to-right never overlap in flight
- [x] Measured partway through the flight, not only at rest, with the failing tap order
- [x] Every die still lands in the berth its set-aside order gives it
- [x] The reserved sweep is unchanged and no die is clipped
- [x] Nothing on the play screen shifts while dice are in flight
- [x] Reduced motion still has no flight
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [x] `card-design 09`'s open criterion is closed, and its Comments say what the answer was
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

**The option taken was the third one, and only half of it.** The berths take the order the dice sat
in on the table rather than the order they were tapped — but the row still records the order dice
were *set aside* in, because that is not the same thing. `[...turn.setAside, ...chosen]` still
appends, so one »herauslegen« is still one stretch of the row and the stretches are still in order.
What changed is the order *within* one stretch, and there was never an order in there to record: all
of those dice were set aside in one act. Tapping is not setting aside — it is reversible, and the app
already says so by animating nothing on a tap. So the row gives up nothing and gains something, which
is that it now reads as the table read: left to right, in the arrangement the Player was looking at
when they chose.

The other two options were weighed and neither can work, for the same reason. The dice start spread
across the grid and land one berth apart, so the moment two crossing paths meet is in the last
quarter of the flight. A stagger buys no distance there — a spring at 85% of its duration is barely
moving — and an arc has closed by then, because both dice have to be in their own berths at the end.
The crossing is not a near miss either: with the same start beat and the same duration, the gap
between two crossing dice runs straight through zero. Not crossing at all is the only answer.

**Two things came out of it that the ticket did not name.**

Matching a landed die to a hand die by face was taking the first spare one, which could pick a die
the Player never touched and cross the one beside it — a Roll of 1, 5, 1 with the last two set aside
did exactly that. It now reads the hand left to right in step with the row, which is the same rule in
the same place.

And ordering by the Roll's own numbering only half fixes it, because the hand of six is two rows of
three: the fourth die sits *under* the first, not right of the third. So the order is measured off
the grid rather than worked out from the index — and two dice of one column, which start one directly
above the other and land side by side, then still grazed by 1.5px at 390×844. Their gap turns from
vertical to horizontal on the way down and the narrowest it gets is `pitch·H/(pitch+H)`, which wants
the row's gap above `w²/(H−w)`: 5.9px on the shortest phone and 12.7px on the tallest, against the
flat 8px it was. `--play-set-aside-gap` is that clearance, growing with the dice like everything else
on this screen — 8px at the bottom, 17px at the top. The row is one line at every size (widest: 265px
of a 300px column at 320px) and its height is unchanged, so nothing below it moves.

## Measured

A second Vite root rendering the real modules — `Die`, `takeoffs`, `DIE_LANDING`, `index.css` — driven
by headless Chrome over CDP, sampling every die's box on every frame of the 400ms. Worst overlap
between any two dice at any frame, with the failing tap orders:

| viewport | case | before | after |
| --- | --- | --- | --- |
| 390×844 | roll 1·3·5, tap 3rd then 1st | 25.4px @136ms | 0 |
| 390×844 | roll 5·1·1·1, tap 4th then 1st | 27.7px @113ms | 0 |
| 390×844 | roll 1·2·5·3·1·1, tap 6·3·1·5 | 11.8px @130ms | 0 |
| 390×844 | roll 1·2·5·3·1·1, all six | 16.3px @151ms | 0 |
| 375×667 | roll 1·3·5, tap 3rd then 1st | 21.1px @149ms | 0 |
| 375×667 | roll 1·2·5·3·1·1, all six | 12.8px @156ms | 0 |
| 375×553 | roll 1·3·5, tap 3rd then 1st | 15.5px @159ms | 0 |
| 375×553 | roll 1·2·5·3·1·1, all six | 10.8px @166ms | 0 |
| 320×900 | roll 1·3·5, tap 3rd then 1st | 29.9px @129ms | 0 |
| 320×900 | roll 1·2·5·3·1·1, all six | 14.5px @153ms | 0 |

Twenty-four runs after the fix across four viewports, every one at nought. The still frames confirm
what the numbers say: mid-flight, before, the 5 and the 1 are one slab with the 5's right-hand pips
sliced off along a straight edge; after, two separate dice with clear ground between them.

Reduced motion is untouched — the hand is still passed empty and there is no flight to order. Nothing
shifts: the change is one horizontal gap in a row whose height is pinned, and the flight is still
transform-only out of a berth the row already holds. The reserved sweep is untouched; the dice in the
row do not tumble and their box is still pinned to `--die-size`.
