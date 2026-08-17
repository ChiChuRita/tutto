# 02 — The dice land unevenly

**What to build:** A Roll looks thrown rather than arranged. Each die settles at its own slight
angle instead of sitting perfectly square in a grid.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Rotation only — no offset

This is the whole of the constraint and it is not negotiable. Each die's box reserves **1.8 × its
size** for the room the cube sweeps through while tumbling, and that reserve is what stopped dice
painting over one another — a bug that looked like clipping for a long time and was fixed by
measurement. **A random offset spends exactly that reserve.**

So: tilt, not displacement. A few degrees per die, around the axis facing the Player, with every
die's centre exactly where it is today. The reserved sweep is untouched and the fix stays fixed.

## Seeded, not random

Every device must see the same throw, and a re-render must not re-roll the arrangement. Derive the
tilt from the Roll — but **not from the faces alone**: two identical Rolls in one Turn would then
produce the same arrangement, and that is the exact trap the shared-selection lane just had to fix
in its own key. Fold in something that changes per Roll.

## What must not break

- **The resting face is still the face the server chose.** A tilt is decoration on top of the
  resting rotation, never a change to which face is up (ADR 0001). A die must still read
  unambiguously — this is a few degrees, not a lean.
- **The tumble still ends where it ends.** The tilt is where the die comes to rest, not a wobble
  after it.
- **No die may paint over another at any angle.** Verify it the way the crossing bug was verified:
  measure boxes, not stills.
- Reduced motion: dice appear at their faces, tilt or no tilt — say which you chose and why.
- The play screen still fits: 390×844, 375×667, 375×553.

- [ ] Each die in a Roll rests at its own slight angle
- [ ] No die's centre moves, and the reserved sweep is unchanged
- [ ] No die paints over another at any angle — measured, not eyeballed
- [ ] Every device shows the same arrangement for the same Roll
- [ ] A re-render does not change the arrangement
- [ ] Two identical Rolls in one Turn do not produce the same arrangement
- [ ] The face the server chose is still unambiguously the face that is up
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
