# 14 — The play screen fits the phone

**What to build:** No scrolling during play. Everything a Player needs mid-Turn — whose Turn it is,
the piles, the Card's effect, the dice, what is set aside, and the buttons — sits inside the screen
at once, on a real phone, in the worst case the game can produce.

**Blocked by:** Sequenced after the lanes currently in flight (`no-spoilers 01`, `card-design 11`),
which are rewriting parts of this same screen.

**Status:** done

## This is a stricter goal than the one we have been measuring

Everything so far has measured **headroom to the bottom of the dice**, currently 198px at 390×844.
That is not the same as fitting. The play screen's document is about **930px tall against an 844px
viewport** — the »Herausgelegt« row and the button column hang below the fold, so the page scrolls.

The new bar: the document is no taller than the viewport, on the play screen, always.

## Use the dynamic viewport, not a number

A phone's browser chrome appears and disappears as you scroll, which is why every headroom figure so
far has come with a caveat about "real Safari chrome takes 50–90px". `dvh` is the unit that tracks
that live. The play screen should fit the space that actually exists at the moment, rather than a
fixed guess about how much a browser is using.

## The worst case it must survive

Four Seats, the »letzte Runde« banner showing, a Card whose effect wraps to two lines, six dice on
the table, six dice set aside. Measure that, and measure it at **375×667** as well as 390×844 — an
older or smaller phone is where this actually breaks.

## What gives, in order

Space runs out somewhere, so decide deliberately rather than letting the last element lose:

1. **Never lost, at any size:** the six dice, the primary action button, and whose Turn it is.
2. **Compresses first:** the effect sentence — smaller, or fewer lines.
3. **Then:** the »Herausgelegt« dice, which are already smaller than the ones in hand.
4. **Then:** the piles and the Card.
5. **Last resort:** the dice themselves.

The dice come last because reading a Roll is the game. If they have to shrink on a small phone, so
be it — but everything else gives first.

## What must not break

- **Nothing may shift under the Player's thumb.** The screen holds fixed heights per phase so a
  message appearing or a button changing does not move anything. Heights derived from available
  space are fine — they must be stable _within_ a viewport, not identical across viewports.
- **Nothing may be clipped.** Each die's box reserves the room its cube sweeps through while
  tumbling; an earlier bug that looked like clipping was dice painting over one another. A layout
  that fits by cutting into that reserved room brings it straight back.
- The scoreboard is already one tappable row with the rest behind a modal — that stays.

- [x] At 390×844, the play screen does not scroll in the worst case above
- [x] At 375×667, the play screen does not scroll in the worst case above
- [x] The six dice, the primary button and whose Turn it is are visible at every size tested
- [x] The layout responds to the viewport actually available, not a fixed assumption about chrome
- [x] Nothing shifts position between phases at any one size
- [x] No die is clipped and no die paints over another at any size
- [x] Numbers reported for every viewport measured, not just the ones that pass
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## What the browser measured

Real headless Chrome over CDP, the real play screen against a fixed position, the worst case the
ticket names: four Seats, the »letzte Runde« banner up, a Card whose effect wraps to two lines, six
dice on the table and six set aside. »needs« is what the column asks for with `min-h-dvh` taken off;
»spare« is the viewport less that.

| viewport | needs | spare  | scrolls | die  | die box | Card | move |
| -------- | ----- | ------ | ------- | ---- | ------- | ---- | ---- |
| 390×844  | 795.3 | +48.7  | no      | 56.0 | 100.8   | 96   | 48   |
| 412×915  | 795.3 | +119.7 | no      | 56.0 | 100.8   | 96   | 48   |
| 344×882  | 795.3 | +86.7  | no      | 56.0 | 100.8   | 96   | 48   |
| 320×844  | 793.8 | +50.2  | no      | 55.6 | 100.0   | 96   | 48   |
| 390×754  | 716.6 | +37.4  | no      | 49.0 | 88.2    | 83.8 | 46.8 |
| 375×667  | 640.6 | +26.4  | no      | 42.3 | 76.0    | 72.1 | 45.6 |
| 360×640  | 617.1 | +22.9  | no      | 40.1 | 72.3    | 68.4 | 45.2 |
| 375×600  | 582.0 | +18.0  | no      | 37.0 | 66.7    | 63.0 | 44.7 |
| 320×568  | 556.4 | +11.6  | no      | 34.6 | 62.2    | 60.9 | 44.3 |
| 375×553  | 544.5 | +8.5   | no      | 33.4 | 60.1    | 60.2 | 44.1 |

Where it stood before: 929.6px at every viewport, so 390×844 scrolled by 85.6 and 375×667 by 262.6.

The last three rows are the ones that matter beyond the ticket: an iPhone SE's screen is 667 tall
but Safari only hands the page about 553–600 of it, and `dvh` is what turns that into a layout
rather than a caveat. Below about 545 of viewport the ramp stops and the page scrolls — no phone in
portrait is that short.

Phase stability: the four phases (choosing, a Niete, nothing rolled, a TUTTO) put the header, the
stat row, the effect, the scoreboard, the dice grid, »Herausgelegt« and the button column on
identical coordinates at every viewport. One exception, reported rather than hidden: the set-aside
row's top sits 0.1px lower when the news line has two lines of text in it, from Chrome rounding a
line box. Nothing below it moves — the button column is at the same pixel either way.

Nothing overlaps: measured pairwise, no two die boxes and no two »Herausgelegt« berths share a
pixel at any of the ten viewports. The box is 1.8× the die at every size, so the room the cube
sweeps through is reserved in full. The old note about the boxes overlapping below 360px was true —
0.8px of it at 320×844 — and is now a `min()` instead of a note.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
