# 16 — Modern but cute

**What to build:** The app stops looking like a well-made utility and starts looking like a game.
Pastel colours on a deep soft base, rounder shapes, a rounded typeface, and motion with a bit of
bounce in it.

**Blocked by:** None. But note ticket 15 (hold to charge the roll) changes the dice animation, so if
both are in flight expect a merge in the dice grid.

**Status:** ready-for-agent

## The direction, settled

**Pastel accents on a deep soft base.** The page moves off near-black (`#171717`) to a deep plum or
navy — soft rather than stark, a table at night rather than a terminal. On top of it, pastel mint,
peach, lavender, sky. Every existing contrast decision was made against a dark page and stays valid,
which is why this base and not a light one: the dice are near-white with no border, and a light page
is exactly the bug that got light mode deleted a few hours ago.

Do not reintroduce theme-conditional styling. The app is one theme, deliberately.

**A rounded typeface**, from the system — `ui-rounded` / SF Pro Rounded where it exists, with a
graceful fallback to the current stack elsewhere. **No webfont, no dependency, no download.** Type
does more for "cute" per line changed than anything else here.

**Rounder shapes and softer depth.** Larger corner radii, soft shadows rather than hard borders where
a border is doing a shadow's job. Keep it restrained — the difference between cute and childish is
mostly restraint.

## Motion gets a bounce, with one exception

Springs with a little overshoot on things that **arrive**: the Card landing in its slot, dice flying
to »Herausgelegt«, the modal opening, numbers finishing a count.

**Never on the dice tumble.** A die that overshoots as it settles reads as a re-roll, and the tumble
is a CSS keyframe on the compositor for good reasons. It stays as it is.

The motion library is already here and already configured with a shared vocabulary in `src/motion.ts`
— springs belong there, next to the durations, not scattered.

## The two things this must not break

**1. The play screen fits the phone, and it fits by a budget.** `--room: clamp(0px, 100dvh - 548px,
296px)` in `index.css`, with every height that may give taking a share. Bigger type, more padding,
and shadows that need breathing room all spend that budget. **Re-measure at 390×844, 375×667 and
375×553** and report the numbers — a restyle that quietly undoes the fitting work is the most likely
way this ticket goes wrong.

**2. Nothing may shift under the Player's thumb**, and no die may paint over another. The dice grid
reserves `1.8 × --die-size` per die for the room the cube sweeps through; an earlier bug that looked
like clipping was really dice overlapping. Rounder, softer and springier must not eat into it.

## Scope

Every screen, not just the table: the start screen, the Games list, the lobby, sign-in, the stats
table and the result screen. Several of those were built by implementation agents in passing and have
never had a design pass at all — this is that pass.

Out of scope: a mascot, illustrations, decorated backgrounds, and sound. If the app wants character
beyond colour, shape, type and motion, that is a separate decision with real art direction behind it.

- [x] The page sits on a deep soft base, not near-black, with pastel accents throughout
- [x] A rounded system typeface is used, with a fallback and no webfont or dependency
- [x] Corners, shadows and borders read as one deliberate set rather than per-component choices
- [x] Arrivals spring with a little overshoot; the dice tumble does not
- [x] Springs live in the shared motion vocabulary, not scattered across components
- [x] The Card families are still instantly distinguishable from each other
- [x] Every screen got the pass, including the start screen, the lobby, sign-in and the stats table
- [x] No theme-conditional styling is reintroduced
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported
- [x] Nothing shifts position between phases, and no die paints over another
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## What the fold cost

The measurement the ticket asked for: what the column asks for against what the viewport hands it,
worst case — four Seats and the »letzte Runde« banner up.

| viewport | column asks | viewport | scrolls |
| -------- | ----------- | -------- | ------- |
| 390×844  | 796         | 844      | no      |
| 375×667  | 641         | 667      | no      |
| 375×553  | 545         | 553      | no      |

The same measurement on the branch before the restyle gives the same three numbers, so nothing on
the play screen grew: the budget in `index.css` is untouched and every height still spends its share
of `--room`. One loose end, stated rather than tidied away: `index.css` quotes the 844 case as 795,
from lane 14's measurement of the same screen to a tenth (795.3). The two runs disagree by a pixel
of rounding rather than by anything the screen did, and neither has been re-measured to a tenth
since — so the figure to trust for headroom is the ~48px of spare, not the last digit. A re-measure
would settle which of 795 and 796 the restyled screen actually asks for.

Colour is twelve tokens in `@theme` and nothing outside it: three surfaces, four pastels, one quiet
value. `--color-muted` is what quiet type is said in — one value rather than an `opacity` per
component. Corners are three named jobs, control / tile / panel, so every `rounded-*` says what kind
of thing it is on, and borders that were doing a shadow's job are shadows.

Springs live in `motion.ts` beside the durations, given a duration and a bounce rather than a
stiffness, so `settled.ts` still holds a Roll's news back for exactly as long as the movement showing
it runs: the shape changed and the clock did not. The Card lands with 9% of overshoot, a die reaching
»Herausgelegt« with 1.5% — at most 5.3px past its berth against the row's 8px gap, so a die's
overshoot cannot put it inside its neighbour. The dice tumble is untouched.

One thing measured and left alone: two dice already cross each other mid-flight when the tap order is
not the grid order, by about 20px, and did so on the branch before this restyle. That is the paths,
not the transition — same start, same end, same duration — and it is `card-design 17`.
