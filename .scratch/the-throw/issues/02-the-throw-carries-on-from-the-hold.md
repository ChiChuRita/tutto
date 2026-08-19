# 02 — The throw carries on from the hold

**What to build:** Letting go of the dice looks like letting go of the dice.

There are two discontinuities at the moment of release, and both are measured rather than felt:

- **Speed.** The wind-up tops out at 1440°/s. The tumble opens at roughly 3150°/s for a three-turn die. So releasing the throw makes the dice _speed up_ by about 2.2×, which is the opposite of what a thrown object does and is why the release reads as a cut rather than a launch.
- **Angle.** The tumble begins from an angle derived from the die's seed, which has nothing to do with where the hold left that die. The cube jumps to a new orientation on release.

After this ticket each die leaves the hold at the speed and orientation it actually had, and decays from there to the face the server chose.

**Blocked by:** 01 — Six dice, not one die six times. The hand-off point is "where was _this_ die when the thumb came up", and that is precisely what 01 defines. Not a file-overlap edge: until each die has its own wind-up angle there is no per-die angle to hand off.

**Status:** done

The constraint that makes this its own ticket, and the reason it cannot be solved by simply starting the tumble faster:

**The tumble's length may not vary with the hold.** A phone watching the table never saw the hold at all, and how long the screen withholds the Roll's news is a pure function of the position. A ten-second hold and a tap must take the same time to settle. So the opening speed has to match the hold while the total duration stays fixed — which means the easing curve absorbs the difference, and a hard-held throw decays more steeply than a tapped one rather than running longer.

The curve's shape is documented in the stylesheet in four acts (airborne, settling, teeter, flop). Whatever replaces or parameterises it should keep that character — in particular the deceleration stays monotonic through the settle, because a die that speeds up mid-roll reads as a glitch, and the one deliberate acceleration near the end is the die falling off its edge and should survive.

Both ends of the keyframe still have to land the die on the face the server chose. The animation may not change the outcome by a degree (ADR 0001).

- [x] Sampled frame by frame across the release, angular velocity is continuous — no step change at the moment the thumb comes up
- [x] The same sampling shows no orientation jump: the die's angle at the first tumble frame matches its angle at the last hold frame
- [x] A throw released at the top of the charge and a throw released instantly both settle in the same total time
- [x] A hard-held throw is visibly faster off the release than a tapped one, and the difference is a decay rate rather than a duration
- [x] Every die still comes to rest on the face the server chose, at the resting orientation, for all six faces
- [x] The deceleration stays monotonic through the settle; the late flop survives
- [x] The keyframe/duration tie-up test still passes, and a watching phone still holds the news for exactly as long as the throwing phone
- [x] Measured before/after evidence in the ticket comments: velocity across the release for a tap and for a full-charge hold

## Comments

Built on `lane/02-the-throw`, merged into `epic/the-throw`.

Measured on a real table, die 0, degrees per second:

|                     | last hold frame | first tumble frames         |
| ------------------- | --------------- | --------------------------- |
| tap, before         | 253             | **12393** spike, then ~3900 |
| tap, after          | 275             | 281                         |
| full charge, before | 1679            | **19243** spike, then ~3900 |
| full charge, after  | 722             | 679                         |

Die 0 settles at 950ms in every case — tap or full charge, before or after. The
duration genuinely did not move.

The landing stays correct because both ends of the path are fixed before any
arithmetic runs: the start is congruent to the hold's angle mod 360, the end is
the element's own resting transform, and only the count of _whole turns_ — which
are invisible at the landing — and the shape between them vary. The leftover is
absorbed by a push squared off zero, so the first frames after release are the
hold's speed and nothing else, and a hard-held throw decays more steeply rather
than running longer.

The `linear()` easing had to go: X and Y take different whole-turn counts, so
one timing function cannot say both. It is now a sampled path of 19 keyframe
stops. The curve's four acts survive intact in `DECAY`, with every act boundary
landing on a stop so the teeter and the flop are not smeared.

Left alone: a watching phone still gets the seeded start, because `wound` is
this device's own press. Nothing regressed there — it is what it was. And
`useHold`/`useRelease` have no unit test, because the repo has no hook test
setup and the lint rules forbid refs during render; verified in the browser
instead.
