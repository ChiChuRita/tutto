# 04 — A neutral table, and Cards that read as objects

**What to build:** Four things a Player said after playing it, in one pass over the play screen's
look and proportions.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## 1. The table stops being purple

The base is a plum (`--color-base: #1a1526`, with `--color-raised` and `--color-lifted` tinted to
match) and the Cards on it are pastels. A **coloured** base tints everything sitting on it, which is
why pastel Cards on purple go muddy rather than bright.

**Go neutral: a charcoal or slate table, and properly saturated Card colours** instead of pastels.
The table recedes, the Cards become the brightest objects on screen — which is right, because they
are the things a Player is looking at.

This supersedes the pastel direction of `card-design 16`, which was chosen before anyone had played
it on a phone. Keep everything that decision got right: one theme and no theme-conditional styling;
colour stated as tokens in `@theme` and nothing outside it; quiet type said in `--color-muted` rather
than an `opacity` per component; corners as three named jobs.

**The families must stay instantly distinguishable** — Bonus, multiplier, forcing. Saturating them
is not licence to move them closer together.

## 2. »TUTTO« stops overfilling the card back

`.card-wordmark` carries `letter-spacing: 0.35em` — a third of an em between every letter — which is
what pushes the word edge to edge and makes the back look overfilled. Set it so the wordmark sits as
a **small mark on a card back**, with air around it, rather than spanning the card.

## 3. »Im Zug« gets smaller, and the Cards get bigger

The Turn score tile is the widest thing in the stat row and it holds one number that is usually
small. Take space from it and give it to the piles — **bigger Cards**, which are the thing the
Player is reading.

**The fold is the constraint and it is hard-won.** `--room: clamp(0px, 100dvh - 548px, 296px)` and
every height that may give takes a share; the play screen does not scroll at 390×844, 375×667 or
375×553, in both leaderboard regimes. **Re-measure all three and report.** Bigger Cards must come out
of the stat row's own width and whatever slack the budget has, not out of the dice.

## 4. Make it beautiful

The three above are specific. This one is not, and it is the actual ask: the Player wants the screen
to look better, not merely different. Use the pass to fix what a fresh eye would flag — weight,
spacing, contrast, hierarchy — rather than only executing the three items.

## What must not break

- **Nothing may shift** under the Player's thumb: fixed heights per phase, everywhere.
- **The dice keep their reserved sweep** (`1.8 × --die-size`). It is what stops them painting over
  one another, and it is not a source of spare room.
- **The set-aside row's gap** clears a same-column pair by arithmetic written into `index.css`;
  if the dice change size, that clearance has to still hold.
- **Contrast** stays legible — the pips, `--color-muted` on each surface, and the Card faces.
- Reduced motion, ADRs 0001/0003/0007, and the settled position are all untouched by a restyle.

- [ ] The table is neutral, not tinted, and the Card families are saturated rather than pastel
- [ ] The three families are still instantly distinguishable from each other
- [ ] Colour is tokens in `@theme` and nothing outside it; no theme-conditional styling
- [ ] »TUTTO« sits as a small mark on the card back with air around it
- [ ] The »Im Zug« tile is smaller and the Cards are bigger
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported, both
      leaderboard regimes
- [ ] No die is smaller than it is today, and the reserved sweep is unchanged
- [ ] No two dice overlap in the hand or in flight at any size
- [ ] Nothing shifts position between phases
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
