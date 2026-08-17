# 05 — Cards in the game's own colours

**What to build:** A Card is printed in the colour the published deck prints it in, so a Player who
owns the box recognises what has landed before they read it.

**Blocked by:** None — can start immediately.

**Status:** done

## The complaint

»It's confusing that all cards have the same color.« Colour meant _family_, and the Forcing family
is five of the eleven Cards — so the Stop-Karte, Feuerwerk, Straße, Plus/Minus and the Kleeblatt all
arrived on the same red ground. Five Cards that do five unrelated things, telling you nothing apart
from each other at a glance, and between them a good half of the faces a Player ever sees.

## The palette is the game's, not ours

Taken from the 2024 rulebook, which colour-codes the name of every Card in the list it gives them in
and photographs all seven kinds beside it:

| Card                      | Ground |
| ------------------------- | ------ |
| Bonus 200–600, ×2, Straße | blue   |
| Stop-Karte, Plus/Minus    | red    |
| Feuerwerk                 | green  |
| Kleeblatt                 | cream  |

This is the only thing taken from the published deck — the marks stay ours and drawn in the app.
The colours are not worth inventing: they are how somebody who has played the physical game already
knows which Card is on the table, and a scheme of our own throws that recognition away for nothing.

**This supersedes the one-colour-per-family scheme of `card-design 01`**, re-saturated in `04`. Keep
what that got right: colour is tokens in `@theme` and nothing outside it, one theme, no
theme-conditional styling.

## What the family signal costs, and where it goes

The OG palette does not encode the family — a Bonus, ×2 and a Straße share blue and are three
different families. So colour can no longer carry it.

**The motif carries it alone.** The star, the double diamond and the padlock are already on every
face; they stop being a second copy of what colour said and become the only thing saying it. That
means they may not be quietly dropped later as redundant, and a test has to pin that.

## What must not break

- **Ink stays legible on every ground**, at corner-index size — that is 4.5:1 minimum on a 10px
  index, not just on the mark.
- **Azure is never a Card.** It is the app's own hand: the move you may make, the die you picked up,
  the shared selection watchers see, the focus ring. A blue Card must not read as a blue die.
- Nothing shifts, no height changes, the fold budget is untouched — this is colour only.
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [x] Each Card is printed in the published deck's colour for it
- [x] Feuerwerk is green
- [x] The five Forcing Cards no longer share one ground
- [x] Colour is tokens in `@theme` and nothing outside it
- [x] The family is still readable on the face, and a test fails if colour is made to restate it
- [x] `--color-ink` clears 4.5:1 on all four grounds at every size the face uses it
- [x] The Card blue is tellable from azure, which is not a Card
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

**Four tokens, measured rather than picked.** `--color-cobalt: #2f8fc8`, `--color-ember: #f25a45`
(retuned from the coral `#fd7052` to a truer red), `--color-fern: #63b53c`, `--color-straw: #f2e6a8`.
`--color-ink` reads on them at 5.07 / 5.45 / 7.07 / 14.36:1, and they sit 52 to 111 ΔE apart from
each other, so no two Cards read as the same Card.

**`colour` is a field on the face in `cards.ts`, beside `family`, `name` and `mark`** — it is a fact
about the deck, not a styling choice, and putting it there is what makes it testable without pulling
React into the test. `Card.tsx` keeps only the four-entry map from named colour to class.

**The opacities came off the face, and they had to.** `.card-corner` and `.card-motif` carried
`opacity: 0.85` and `.card-name` `0.8`. Against the deepest of the four grounds that put the index at
**4.22:1** — under the 4.5 a 10px index needs. All three are full ink now, which is the call this
file already made everywhere else (`--color-muted` exists so that quiet type is a colour and never an
alpha), and here it needs no colour at all: the mark is 1.5em at weight 900 against a 0.5em index, so
size and weight already say which is which. A printed card does not grey out its own corners.

**Cobalt sits 16 ΔE off azure**, which is closer than the other pairs and is the one number worth
stating plainly. Pushing it further apart means going darker, and `#1f7ab5` — far enough at 21 ΔE —
drops the ink to 3.89:1 and fails the index. The pair is livable because they are never the same kind
of object: azure marks dice and controls, a Card is neither and never takes a focus ring. Fern sits
28 ΔE off jade, which only ever appears as a presence dot and in the record.

**Four new tests**, and each was checked against a mutation that should break it — putting all five
Forcing Cards back on ember fails all four. The last one is the one worth keeping: cobalt spans all
three families, so if anybody makes colour restate the family again, the test that says the motif has
real work to do goes red.

348 tests, lint, build and prettier clean. Rendered all eleven faces through the real `PlayedPile`
path in headless Chrome with reduced motion emulated, and looked at them.

**What only a human can settle:** whether the cream Kleeblatt is too bright to sit on the table
(it is the palest thing on screen, which suits the one Card that wins outright); whether two red
Cards — Stop and Plus/Minus — are far enough apart on their marks alone; and whether the Straße's
row of six dice is legible at this size, which is unchanged by this ticket but is the least readable
face in the deck.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
