# Spec: Back to the Papier ground

Status: done

## Problem Statement

The user's words: "why does the ui looks ugly again?"

Checked first, because "again" could have meant a regression. It was not one. The live site was
serving exactly what was committed: a screenshot of https://chichurita.github.io/tutto/ and a local
build of the same commit at 390x844 were pixel-identical, every asset loaded (no 404s), and `h1`
computed to `"Archivo Variable"`, so the ground was rendering as designed.

What had happened is that the look changed on prod on 2026-08-30 19:03 UTC, when `0280dad` "The
Tippschein ground" deployed. Neither commit that day touched styling: `7189b64` changed the order of
one list and `c72fb82` changed the reducer.

The direction had moved twice, each time away from colour:

| | |
| --- | --- |
| 2026-08-17 `b2e6973` | Modern but cute: pastel on a deep plum table, rounder, with a bounce |
| 2026-08-19 `ba3245e` | Papier: the table is a printed page |
| 2026-08-28 `0280dad` | The Tippschein ground: two inks, no colour, marks instead of hues |

Asked which direction they wanted. Answer: revert the ground to Papier.

## Scope

`git revert 0280dad`, which lands `Game.tsx` back on `34a6e46`'s version and so keeps the ranked
dialog and the place figures, since those predate the ground.

Kept out of the revert, because they are not the ground:

- `package.json` / `package-lock.json`. The revert would have downgraded eight unrelated dev
  dependencies. Only `@fontsource-variable/archivo` was removed, and only because Papier uses system
  faces, so nothing referenced it. Saves the 90 kB woff2 from the bundle.
- `PRODUCT.md` and `CONTEXT.md`. Both are ground-agnostic: neither names Tippschein, its classes or
  its colours. `PRODUCT.md` did not exist before `0280dad`, so reverting would have deleted it.
- `.scratch/`. The tickets are the record of what was decided and why. They get comments saying what
  the revert kept and dropped instead.
- The two reducer fixes and the ranked final standings.

Re-applied on Papier afterwards, because they were never about the ground:

- The record's `h2`. `Deine Spiele` and `Offene Spiele` carry one on Papier too, so the record was
  still the only unheaded block on the start screen. WCAG 2.2 AA is binding.
- The empty home screen's sentence. Papier showed nothing at all where the games list goes, which
  reads as a page that failed to load.
- A favicon and `theme-color`, redrawn in Papier's three values. Page furniture, not the ground, and
  without them the tab gets the browser's blank icon and the status bar goes white.
