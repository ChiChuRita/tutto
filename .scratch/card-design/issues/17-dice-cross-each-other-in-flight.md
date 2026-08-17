# 17 — Dice cross each other on their way to »Herausgelegt«

**What to build:** Fix dice overlapping mid-flight when several are set aside at once. This closes the
one acceptance criterion in `card-design 09` that has been open since it shipped — and it is open
because it was never true.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

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

- [ ] Two dice set aside in an order that is not left-to-right never overlap in flight
- [ ] Measured partway through the flight, not only at rest, with the failing tap order
- [ ] Every die still lands in the berth its set-aside order gives it
- [ ] The reserved sweep is unchanged and no die is clipped
- [ ] Nothing on the play screen shifts while dice are in flight
- [ ] Reduced motion still has no flight
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [ ] `card-design 09`'s open criterion is closed, and its Comments say what the answer was
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
