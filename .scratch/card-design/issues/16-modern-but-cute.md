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

- [ ] The page sits on a deep soft base, not near-black, with pastel accents throughout
- [ ] A rounded system typeface is used, with a fallback and no webfont or dependency
- [ ] Corners, shadows and borders read as one deliberate set rather than per-component choices
- [ ] Arrivals spring with a little overshoot; the dice tumble does not
- [ ] Springs live in the shared motion vocabulary, not scattered across components
- [ ] The Card families are still instantly distinguishable from each other
- [ ] Every screen got the pass, including the start screen, the lobby, sign-in and the stats table
- [ ] No theme-conditional styling is reintroduced
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported
- [ ] Nothing shifts position between phases, and no die paints over another
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
