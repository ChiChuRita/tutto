# 03 — The deck thins as Cards leave it

**What to build:** The deck gets visibly thinner as the Game runs. A box with four Cards left does
not look like a full one.

**Blocked by:** 01 — The last Card lies on the pile. Both change how the two piles are drawn, and
doing them in one place keeps the merge small.

**Status:** ready-for-agent

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

- [ ] The deck looks thicker with 50 Cards left than with 5
- [ ] The count printed on it is unchanged and remains the truth
- [ ] The deck's box holds a fixed height and top at every depth
- [ ] The reshuffle refills it as part of the pick-up animation, with no pop
- [ ] Nothing on the play screen shifts as the deck thins
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [ ] Nothing exposes or derives from which Cards are still in the deck (ADR 0003)
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
