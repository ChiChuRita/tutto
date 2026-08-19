# 01 — Six dice, not one die six times

**What to build:** A hand of dice that reads as six objects rather than one object drawn six times.

Today the six cubes move in lockstep. While the Player holds the throw, every die reads the _same_ pair of angles written onto the grid each frame, so all six present the same corner at the same speed — the single loudest reason the table looks unpolished. The tumble is only a little better: each die gets its own start angle, but all six share one duration and one easing curve, and the stagger that is meant to spread them collides. The stagger is `(index + face) % 6` slots of 60ms — six dice into six slots — so pairs routinely start together and land together.

After this ticket each die winds up and comes down on its own: its own phase, its own rate, its own settle. A Player watching a Roll should not be able to find two dice doing the same thing at the same moment.

**Blocked by:** None — can start immediately

**Status:** done

Constraints this must not break, each of which is load-bearing:

- Every per-die difference is derived from that die's existing seed, deterministically. Nothing here may call a random number generator: the faces are the server's and the screen is a replay of a decision already made (ADR 0001). Two phones watching the same Roll must animate it identically.
- How long the screen holds the news back stays pure in the position. If per-die duration varies, the figure that answers "when may the outcome be shown" has to account for the slowest die, and the test that ties the CSS keyframe to that figure has to keep passing.
- The wind-up currently costs two custom-property writes a frame for the whole hand, and no React render. Six independent dice must not become six writes a frame or, worse, sixty renders a second — the per-die variation should fall out of values the cube can compute for itself from what it already knows.
- Whatever is added stays off under `prefers-reduced-motion`, through the existing mechanism rather than a new one.

- [x] While the throw is held, no two dice show the same face at the same angle — verified by sampling the rendered transforms, not by eye
- [x] Each die's wind-up rate differs from its neighbours', and the spread is visible at both the resting speed and the top speed
- [x] Two dice in the same Roll no longer share a start time; the stagger spreads six dice across six distinct moments
- [x] Each die's landing is its own — duration, easing or both vary per die
- [x] The same Roll animates identically on two devices, including one that joined mid-Roll
- [x] The figure that gates the news still covers the slowest die in the hand, and the keyframe/duration tie-up test still passes
- [x] The wind-up still costs a constant number of property writes per frame regardless of how many dice are in hand, and still triggers no React render
- [x] Measured before/after evidence in the ticket comments: sampled transforms across a Roll showing the dice are decorrelated

## Comments

Built on `lane/01-six-dice`, merged into `epic/the-throw`.

Each die applies its own rate and phase in `calc()` over the same two shared
custom properties, so six independent dice still cost two property writes a
frame and no React render. Rates spread 1.125..0.875 on X against 0.925..1.075
on Y — opposite directions, so the dice differ in character rather than only in
speed. Everything is derived from the die's place; nothing from a random number.

Measured over a ten-second hold at 60fps, 626 frames: the closest pair of dice
was **0.00°** apart on every frame before, and **42.2°** at its worst after
(80.8° mean). Also driven end to end against a live Game rather than a test
page.

Two honest limits. The stagger _order_ is the same every Roll — guaranteeing six
distinct slots from a value each die knows on its own means the slot can only
depend on the index; what varies per Roll is the face each die turns to. And
"no two dice ever align" is bounded to the ten-second charge: rates that differ
at all bring two dice round eventually, and rates that never differ are the bug.

**Partly superseded by ticket 02.** The per-die stagger became flight time, and
the per-die _duration_ approach here gave way to 02's sampled keyframe path,
because a die that held still waiting for its slot would have stopped dead on
the release frame. The per-die wind-up rates and phases are untouched and are
what 02 hands off from.
