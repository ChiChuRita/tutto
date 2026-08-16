# 14 — The play screen fits the phone

**What to build:** No scrolling during play. Everything a Player needs mid-Turn — whose Turn it is,
the piles, the Card's effect, the dice, what is set aside, and the buttons — sits inside the screen
at once, on a real phone, in the worst case the game can produce.

**Blocked by:** Sequenced after the lanes currently in flight (`no-spoilers 01`, `card-design 11`),
which are rewriting parts of this same screen.

**Status:** ready-for-agent

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
  space are fine — they must be stable *within* a viewport, not identical across viewports.
- **Nothing may be clipped.** Each die's box reserves the room its cube sweeps through while
  tumbling; an earlier bug that looked like clipping was dice painting over one another. A layout
  that fits by cutting into that reserved room brings it straight back.
- The scoreboard is already one tappable row with the rest behind a modal — that stays.

- [ ] At 390×844, the play screen does not scroll in the worst case above
- [ ] At 375×667, the play screen does not scroll in the worst case above
- [ ] The six dice, the primary button and whose Turn it is are visible at every size tested
- [ ] The layout responds to the viewport actually available, not a fixed assumption about chrome
- [ ] Nothing shifts position between phases at any one size
- [ ] No die is clipped and no die paints over another at any size
- [ ] Numbers reported for every viewport measured, not just the ones that pass
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
