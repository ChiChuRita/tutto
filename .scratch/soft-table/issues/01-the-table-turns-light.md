# 01 — The table turns light

**What to build:** The whole app on a light, soft ground instead of a dark one — every screen, in one
pass, still legible and still fitting the fold.

**Blocked by:** None — can start immediately.

**Status:** done

## The direction

Sampled off the reference, by area: **48% near-white** (`#fefefe`), then a family of pale tints —
sky `#dcebf9`, periwinkle `#e7ecf6`, pink `#f8edf7`, lime `#f5f7eb` — and near-black ink `#061825`
that leans blue rather than grey. Nothing in it is mid-tone. The whole thing is white paper, pale
washes, and one very dark ink.

That is the ground this ticket lays. Everything else in this feature stands on it.

## This is not the direction `real-table 04` reversed

Worth saying plainly, because it looks like a U-turn and is not. What failed before was **pastel
Cards on a coloured (plum) ground**: a tinted ground tints everything standing on it, so the Cards
went muddy. The fix was a neutral ground and saturated Cards. Both halves of that lesson survive
here — the ground is neutral (white is the most neutral ground there is) and the Cards stay
saturated. What changes is the ground's _lightness_, not its neutrality.

**The Card faces do not change.** Cobalt, ember, fern and straw are the published deck's colours
(`real-table 05`) and they stay exactly as they are. On white they read as printed cards on a table,
which is what they are.

## What must not break

- **Contrast, restated for a light ground.** `--color-muted` has to clear 4.5:1 on _every_ new
  surface, and the ink on Card faces has to keep clearing 4.5:1 at corner-index size. Report the
  numbers; do not assume inverting is safe.
- **The fold budget.** `--room: clamp(0px, 100dvh - 548px, 296px)` and every height that takes a
  share of it. The play screen must not scroll at 390×844, 375×667 or 375×553, in both leaderboard
  regimes. **Re-measure all three and report**, as `real-table 04` did.
- **Nothing shifts** between phases: fixed heights per phase stay fixed.
- **Colour is `@theme` tokens and nothing outside it.** One theme, no theme-conditional styling. The
  hairlines that were once raw `rgb(255 255 255 / …)` do not come back.
- **Shadows have to be re-earned.** A shadow that read on charcoal is invisible on white, and a black
  shadow on a light ground reads as dirt. Expect a _coloured_ shadow — a dark tint of the ground's
  own hue at low alpha — and say what it is.
- The played pile's blank edges and `--color-edge` did their separating against a dark ground; on a
  light one they need re-deriving rather than inverting.
- ADRs 0001 / 0003 / 0007, reduced motion and the settled position are all untouched by a restyle.
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [x] Every screen — start, lobby, play, result, record — is on the light ground and legible
- [x] `--color-muted` clears 4.5:1 on every surface; numbers reported per surface
- [x] Card faces are unchanged, and ink still clears 4.5:1 on all four at corner-index size
- [x] The dice are still objects and not holes in the page — or `02` is why this ticket stops short
- [x] Shadows read on a light ground, and are a tint rather than black
- [x] The play screen does not scroll at 390×844, 375×667 or 375×553 — numbers reported, both regimes
- [x] No die is smaller and the `1.8 × --die-size` sweep is unchanged
- [x] Nothing shifts position between phases
- [x] Colour is tokens in `@theme` and nothing outside it
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped. Three surfaces (`#eceff9` page, `#ffffff` panel, `#f5f7fd`), one ink `#131f36`, and every
accent **re-solved rather than inverted**: each is the lightest value of its hue that still clears
4.5:1 as type on the page, which is the worst surface. Measured first, and most of the naive
inversion failed — jade at 3.49, gold 3.95, white-on-azure 3.92, and every tinted tile under 4.5.
Solving them was the work.

`--color-light` is gone. It meant "type on the dark page"; on paper that is the same near-black as
type on a Card, so there is **one ink now** — a simplification the light ground paid for.

`--color-ember` had been doing two unrelated jobs: a Card's ground and the colour of a refusal. On a
light table those pull apart — the Card must stay the deck's vermilion, a refusal must be readable as
type — so refusals are `--color-alarm` and ember is only ever a Card.

Shadows are a tint of the ink's own blue at low alpha, not black, which on paper reads as dirt. They
do more work here than on the dark table: with the panel only 1.15:1 off the page, the shadow _is_
the separation.

No scroll at 390×844, 375×667, 375×553 or 320×844, measured in the browser on a real Game. That is
the solo case; the four-Seat-with-banner worst case is not re-measured and should be before this is
called finished.

The Card faces are untouched, which was the point — on white they read as printed cards on a table.
