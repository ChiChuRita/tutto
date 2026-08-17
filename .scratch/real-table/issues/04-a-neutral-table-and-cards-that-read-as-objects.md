# 04 — A neutral table, and Cards that read as objects

**What to build:** Four things a Player said after playing it, in one pass over the play screen's
look and proportions.

**Blocked by:** None — can start immediately.

**Status:** done

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

- [x] The table is neutral, not tinted, and the Card families are saturated rather than pastel
- [x] The three families are still instantly distinguishable from each other
- [x] Colour is tokens in `@theme` and nothing outside it; no theme-conditional styling
- [x] »TUTTO« sits as a small mark on the card back with air around it
- [x] The »Im Zug« tile is smaller and the Cards are bigger
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported, both
      leaderboard regimes
- [x] No die is smaller than it is today, and the reserved sweep is unchanged
- [x] No two dice overlap in the hand or in flight at any size
- [x] Nothing shifts position between phases
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped on `nt-04-neutral-table`.

**The table is charcoal and the Cards are saturated.** Three neutrals barely off grey — `#16181d`
page, `#21242c` raised, `#2d313a` lifted — and five accents that are colours rather than pale
versions of colours: jade `#2bd583` pays you, orchid `#b184ff` multiplies you, ember `#fd7052`
takes the choice away, azure `#45aefc` is the app's own hand (the move, the die picked up, the
focus ring) and gold `#ffc24d` is the Final round. The families kept their places on the wheel;
only the chroma moved. `--color-ink` reads on each of them at 9.4, 6.6, 6.6 and 7.5:1, and
`--color-muted` clears 5:1 on all three surfaces (6.8 / 6.0 / 5.0), so nothing got less legible for
being brighter. One theme, no conditional styling, and colour is `@theme` and nothing else — the two
`rgb(255 255 255 / 0.0x)` hairlines that were outside it are now `--color-edge`.

**»TUTTO« is a mark, not a banner.** `letter-spacing` 0.35em → 0.1em and the size 0.7em → 0.52em, so
it sits centred on the back with air round it and the deck's count is the thing you read. The
per-component `opacity: 0.75` went with it; the wordmark is said in `--color-orchid`.

**The Cards are bigger, and »Im Zug« stopped being a tile.** `--card-height` went from 6rem to 8rem
at the top of the ramp, and the proportion from 0.68 to 0.714 — a real playing card's 2.5×3.5. At
390×844 the Card went 65.3×96.0 → 91.4×128.0, which is +85% of face. The score tile was `flex-1`
and full height: the biggest object on the table holding the smallest number on it. It is a label
and a number on the table now, so the two piles are the only objects in the row, and its number is
on the budget (`--play-score`) so it narrows with everything else instead of staying 215px wide on a
375px phone.

Where the height came from, since none of it came from the dice: the »letzte Runde« banner gave 38px
by losing its filled pill and fitting on one line, and `--play-quiet` gave 8 more by dropping its
share of `--room`. The Card took 32 of those 46.

**Measured in headless Chrome against a stubbed backend, worst case — four Seats, the banner up,
both leaderboard regimes (three rows above 800px, one below):**

| viewport | regime | before | after | viewport | scrolls |
| -------- | ------ | ------ | ----- | -------- | ------- |
| 390×844  | 3 rows | 829.3  | 815.4 | 844      | no      |
| 375×667  | 1 row  | 640.6  | 620.6 | 667      | no      |
| 375×553  | 1 row  | 544.5  | 517.2 | 553      | no      |

Every one has more headroom than it had. It bottoms out at 512.8px, so it scrolls below about 513 of
viewport. Note the "before" at 844 is 829.3 and not the 795 `card-design 16` reported: the
leaderboard landed between the two tickets and costs 34px in the three-row regime only, which is why
the other two numbers match that ticket's to a pixel.

**The dice are untouched.** `--die-box` measures 100.80 / 76.03 / 60.09 at the three viewports,
before and after, so no die is smaller and the `1.8 × --die-size` sweep is exactly what it was.
`--play-set-aside` and its gap are unchanged, so the same-column clearance arithmetic still holds
unchanged.

**Nothing shifts between phases.** The tops of all eight rows of the play column, measured at
390×844 in `awaitingSetAside`, `awaitingRoll` and `awaitingCard`: 38, 176, 213.9, 305.9, 333.9,
387.9, 599.5, 686.1 — identical in all three.

**Beyond the four items**, and why:

- A set-aside die was `bg-lifted text-muted`, which on a plum page was a shade of the page and on a
  charcoal one is very nearly nothing. It is a grey die with the same ink pips every other die has,
  so only the ground says which state it is in: white in the hand, azure picked up, grey spent.
- The accent-at-15%-over-the-page pills came out a muddy brown. A notice is the raised surface with
  the accent in the type now — the refusal line, the Lobby's and the Account's errors, the Result
  headline — and the »letzte Runde« banner lost its box entirely, since it sits directly under one.
- `--shadow-soft` and `--shadow-lift` are two-part now, contact plus ambient. One blurred shadow on
  a charcoal ground had almost nothing left to darken, and the contact shadow is most of what makes
  a Card read as an object lying on a table.
- `--color-light` is `#eef1f5` rather than pure white: at this contrast a full-white sentence glares,
  and the Cards are what should pull the eye.
- The banner's sentence lost »6000 sind geknackt«, which the leaderboard directly above it says
  already.
- The token names were renamed with the values: mint/sky/lavender/coral/butter → jade/azure/orchid/
  ember/gold. »The pastels« was going to be a comment above five saturated colours otherwise.

**What only a human can settle:** whether the charcoal reads as a table rather than as a dark app;
whether jade/orchid/ember are the right three, and whether ember is red enough to mean »stop« at
arm's length (a truer red will not carry dark ink); whether a Card at 8rem is now too dominant
against the dice; and whether losing the box round »Im Zug« costs the Turn score too much
prominence. Screenshots before and after at all three viewports, plus the eleven faces together, are
in `~/.t3/userdata/attachments/nt04/`.

**One thing measured and left alone:** the dice grid reserves two rows always, so with three dice on
the table the screen carries a `--die-box` of empty space in its middle — 100.8px at 390×844. That
is the fixed-height rule doing exactly what it was built to do (a grid sized to its contents would
lift everything below it the moment a die was set aside), and it is the largest single piece of air
on the screen. Worth a ticket of its own if it ever bothers anyone; not something a restyle may fix.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
