# 03 — The deck thins as Cards leave it

**What to build:** The deck gets visibly thinner as the Game runs. A box with four Cards left does
not look like a full one.

**Blocked by:** 01 — The last Card lies on the pile. Both change how the two piles are drawn, and
doing them in one place keeps the merge small.

**Status:** done

## Why this was refused before, and why it is fine now

The deck is drawn as **three layers whatever the count says**, deliberately. The reason: drawing the
last Card puts all 56 back, so a stack that tracked the count would suddenly pop from one layer to
full — a visual event for something that was not an event.

That reason has expired. The reshuffle is now an animation: the played pile is picked up, turned
face-down and settles onto the deck. So a deck that thins does not pop back — **it gets refilled, and
you watch it happen.** The thing that made this a glitch is now the thing that makes it a moment.

## How thin

The count is the truth and stays printed on the deck; the thickness is an impression, not a gauge.
Nobody should be counting layers to work out what is left — a few steps between full and nearly empty
is plenty, and the top of the deck must not move as it thins, because everything on this screen holds
its height.

- [x] The deck looks thicker with 50 Cards left than with 5
- [x] The count printed on it is unchanged and remains the truth
- [x] The deck's box holds a fixed height and top at every depth
- [x] The reshuffle refills it as part of the pick-up animation, with no pop
- [x] Nothing on the play screen shifts as the deck thins
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [x] Nothing exposes or derives from which Cards are still in the deck (ADR 0003)
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped on `rt-03-deck-thins`. Three steps and no more: `deckEdges(left)` in `pile.ts` says how
many of the deck's two edges show — both above 37 Cards, one from 37 down to 19, none below. It is
thirds of the box, which is coarse on purpose: the count is printed on the deck and is the truth,
and a thickness with per-Card fidelity would be a second number standing beside the first.

Nothing is added or removed to thin it. An edge that is not showing lies exactly under the top
card, hidden by it, and `--shown` is a factor on its offset — so a deck filling out is edges
sliding out from under a card that has not moved, and the box is one card at every depth.

The refill is a CSS transition of `--deck-refill`, which is `PICKUP_MS`: measured in headless
Chrome, the edges finish sliding on the frame the played pile lands on the deck (pile lands ~304ms,
edges settle ~337ms), so the pick-up lands on a thin deck and leaves a full one. `settled.test.ts`
holds that copy of 300ms against `settled.ts`, the way it already holds the dice keyframe.

The last edge to go is the one on the far side from the played pile, so a thinning deck stops
fanning towards its neighbour before it stops fanning at all — the pile's own note about fanning
right stands.

Measured with a stubbed-backend harness in headless Chrome, four Seats, at 390×844, 375×667 and
375×553 — which covers both leaderboard regimes, three rows only above 800px. No scroll at any of
them with 56, 40, 20, 4 or 1 Card left, with and without the »letzte Runde« banner. The deck's box
is identical at every depth: 65.27×95.98 at 390, 49×72.06 at 375×667, 38.53×56.67 at 375×553, top
and left unchanged to the pixel.

What only a Player can settle: whether three steps read as a deck running down rather than as a
glitch, and whether the deck filling out under the pile reads as one event.
