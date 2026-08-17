# 02 — The dice land unevenly

**What to build:** A Roll looks thrown rather than arranged. Each die settles at its own slight
angle instead of sitting perfectly square in a grid.

**Blocked by:** None — can start immediately.

**Status:** done

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

- [x] Each die in a Roll rests at its own slight angle
- [x] No die's centre moves, and the reserved sweep is unchanged
- [x] No die paints over another at any angle — measured, not eyeballed
- [x] Every device shows the same arrangement for the same Roll
- [x] A re-render does not change the arrangement
- [x] Two identical Rolls in one Turn do not produce the same arrangement
- [x] The face the server chose is still unambiguously the face that is up
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Done on `rt-02-uneven-dice`. `dice.ts` gained `tiltDegrees` — FNV-1a over
`selection.rollKey` plus the die's place in the Roll, giving ±2° to ±5° — and
`restingTransform`, which writes the tilt as the **first** turn in the
transform so it happens in the frame the perspective is in: the axis facing the
Player, in the plane of the screen. Written last it would be the cube's own z,
which after `rotateY(±90)` points sideways, and faces 3 and 4 would come to rest
showing something nobody rolled. A test composes the transform the way the
browser does and asserts the chosen face still faces the camera at every tilt.

The key is `selection.rollKey` itself rather than a second one: it already
carries the Turn's score, the set-aside count and the Seat's Turns taken around
the faces, for exactly the reason this ticket names, and a second way of naming
a Roll is a second way of getting it wrong.

Measured in headless Chrome over CDP against a throwaway Vite root that renders
the Roll grid alone — same markup, same stylesheet — sampling every animation
frame of the whole tumble:

- Centres byte-identical tilted and square at 390×844, 375×667, 375×553 and
  320×844. Rotation only.
- Worst reach outside the reserved box identical to three decimals tilted and
  square (1.324 / 1.355 / 1.392 / 1.324 of the half-box) — the tilt adds no
  extent, because turning about the axis facing the Player moves every point
  around the die's own centre without changing its distance from it.
- No two dice's boxes ever met: minimum clearance 2.17px across six Rolls at
  the tightest size, 218 frames each. Tilted clearance was equal to or better
  than square in every case.

Reduced motion tilts. It is not movement — it is the angle the die is at — and
it is the same angle on every phone at the table, so withholding it would show
that Player a different arrangement for no gain. Measured with
`prefers-reduced-motion: reduce` emulated: no `.die-tumbling`, dice at their
angles, 22-35px of clearance.

Only a human can settle whether five degrees is the right amount, and whether
the tilt reads as thrown rather than as a wonky grid, on a real phone.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
