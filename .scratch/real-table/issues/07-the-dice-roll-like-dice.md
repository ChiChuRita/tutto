# 07 — The dice roll like dice

**What to build:** »Make them look more realistic, roll them more realistic, I think they stop too
fast.« The tumble should read as a thrown die coming to rest, not as a cube turning to a stop.

**Blocked by:** None — can start immediately.

**Status:** done

## The number was never the problem

`06` read »the dice settle too slowly« as a duration and shortened `TUMBLE_MS` from 1200 to 800. The
Player then said they stop too fast. Both complaints are true at once, and neither is about duration.

The tumble is one interpolation from a start rotation to the resting face under
`cubic-bezier(0.15, 0.75, 0.3, 1)`. **Solve that curve and it puts 41% of the rotation in the first
80ms and 95% of it in the first 458ms.** So the die did nearly all its turning in a third of a second
and then stood almost still until the animation ended. It was not stopping early — it was stopping
_fast_, and then dawdling. Lengthening the animation makes the dawdle longer; shortening it makes the
stop harder. **The fix is the rate along the path, not the length of it.**

## Shape it like a throw

A thrown die spins fast while it is airborne, loses energy in discrete bounces, teeters on an edge,
and flops onto its face. Encode that as the timing function.

**Only the rate may change.** The keyframe's two ends stay exactly where they are, which is what
keeps ADR 0001 free rather than argued: the die still comes to rest on the face the server chose,
because the path it travels is untouched.

## What must not break

- **The face the server chose** (ADR 0001). Rate only — never the path, never the ends.
- **Monotonic rotation.** A die that un-rotates makes its own face ambiguous. Exactly one
  acceleration is allowed, and it is the flop.
- **The reserved sweep.** `1.8 × --die-size` and no offsets (`02`). But do not assume the clearance
  measurement carries over: the geometry is unchanged while _which poses co-occur across dice_ is
  not, because each die starts up to 300ms late. **Re-measure, and report both numbers.**
- **`TUMBLE_MS` and the keyframe stay one number**, and the test that reads the stylesheet back has
  to keep biting.
- Reduced motion is untouched — the class is not applied at all.

- [x] The die is visibly turning for very nearly the whole animation
- [x] The rotation decays monotonically apart from one deliberate acceleration at the end
- [x] It comes to rest on the face the server chose, at its own tilt
- [x] Clearance re-measured against the old curve at four viewports, both numbers reported
- [x] The Player waits no longer than before — `TUMBLE_MS` unchanged
- [x] A browser without `linear()` still gets a better curve than the one being replaced
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

**One declaration changed, and it is a `linear()` easing rather than a bezier** — a bezier has two
control points and cannot express a teeter followed by a flop. Sixteen stops, derived from a
simulation of angular speed decaying with restitution at each bounce, then hand-tuned so the envelope
falls monotonically. Four acts, for a three-turn die:

| phase             | time      | speed              |
| ----------------- | --------- | ------------------ |
| airborne, bounces | 0–224ms   | 3150 → 2100°/s     |
| settling          | 224–544ms | 1520 → 675°/s      |
| the teeter        | 544–680ms | down to 270°/s     |
| **the flop**      | 680–768ms | back up to 1080°/s |
| at rest           | 768–800ms | 338°/s, decaying   |

The flop is the one acceleration in the curve and it is the point of the whole thing: about 81° of
rotation, which is a die falling off the edge it was balanced on onto the face it was always going to
show. Everything before it decays, so nothing else reads as a glitch.

**Measured in the browser rather than trusted.** Sampled `getComputedStyle().transform` every frame
and accumulated the angle between consecutive rotation matrices: the rendered curve tracks the model
within ~2% at all sixteen stops, the flop measures 1393°/s against a 623°/s teeter — 2.2× — and the
die is still moving at 400°/s in the final sample. **95% of the rotation now happens by 744ms against
458ms before**, so apparent roll time went up by about two thirds while the wait is identical.

**Clearance re-measured, like for like**, six Rolls at 390×844 / 375×667 / 375×553 / 320×844, every
frame, taking the union of each die's six faces — the cube element alone flatters the result about
tenfold, because the faces are pushed out half a die in Z and are what reach outside it. **Old curve
3.99px worst, new curve 3.50px worst.** The margin tightened by roughly 12%, because the dice are
still moving late rather than parked, so more frames have several of them at large rotations at once.
No two dice met at any viewport. Reported rather than glossed: it is a real reduction in a number
that was already the tightest thing about the dice.

**Looked at, not only measured.** The preview tooling could navigate but its capture failed
throughout, so this went through CDP as everything else in this project has. A filmstrip of the real
play screen at 260 / 700 / 1100ms shows the hand mid-tumble, still turning through the teeter, and
landed — and the eleven-cell strip of one Roll pinned at each moment confirms the faces at rest are
exactly the Roll, each at its own few degrees off square. Worth knowing for the next person: the
per-die stagger means a moment is not the same moment in every die's tumble, and the last die is not
at rest until 800 + 300 = 1100ms, which is what `tumbleMs` already waits for.

**The fallback is better than what it replaces.** `linear()` needs Safari 17.2, so the shorthand
keeps a bezier — but `cubic-bezier(0.3, 0.5, 0.5, 1)`, chosen to track the new envelope (half by 29%,
95% by 75%) rather than the front-loaded curve being removed. Both survive minification; the
`?raw` guard reads source, so the bundler rewriting `800ms` to `.8s` does not blind it.

357 tests, lint, build and prettier clean.

**What only a human can settle:** whether the flop reads as a die falling or as a hitch; whether the
teeter is long enough to make it land; and whether 800ms is now the right length, given the die is
moving for all of it rather than a third of it. If it wants more room, `TUMBLE_MS` is the one number
— and every 100ms on it is 100ms before the Player learns anything, on every Roll of every Turn.
