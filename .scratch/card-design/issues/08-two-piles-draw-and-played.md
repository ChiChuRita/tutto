# 08 — Two piles: one you draw from, one the Card lands on

**What to build:** The deck shifts left and the drawn Card sits beside it, so the top of the screen
reads like a real table: a face-down pile you draw from, and the Card you drew lying next to it.
The draw becomes a short hop between two adjacent card shapes instead of a long flight down the
page.

**Blocked by:** None of the open tickets. Sequenced after the current epic lands, since it moves the
Card slot that epic just built.

**Status:** done

## The shape

The stat row already stands as tall as a card, because the pile _is_ a card. The drawn Card joins it
there: pile on the left, Card beside it. The Card keeps its current size — **the stat row grows to
fit the Card, never the other way round.** A whole lane was spent making the faces mean something at
that size; shrinking the Card to fit the row would undo it.

The stat row also carries the »Im Zug« tile today. Three things across a phone's width is the real
constraint of this ticket — solve it deliberately and say what you chose, rather than letting one of
them get squeezed.

**The played side is a slot, not a growing pile.** It holds the Card in force and nothing else. A
discard pile that accumulates is a second thing to size, to clear at the right moment, and to reason
about across a TUTTO chain — and the symbolism wanted here is already delivered by two card shapes
side by side, one face-down and one face-up. With no Card in force the slot is the dashed outline it
is today.

## What moves and what does not

**The effect sentence stays put** — full width, directly under the stat row, holding its two lines.
It is the only place a rule is spelled out in full, and it is the thing a Player actually reads. So
the row the Card vacates is only partly reclaimed: expect roughly 110px back, not the whole block.

That reclaimed height matters. The play screen has been fighting for ~30px at a time to clear a real
phone's browser chrome; this is the change that should settle it. **Measure the fold and report the
number** — 390×844, four Seats, the »letzte Runde« banner up, a Card whose effect wraps to two
lines.

**The draw animation should need no new geometry.** It already measures the pile's and the slot's
real rectangles and animates between them, so moving the slot ought to be enough on its own. If you
find yourself adding a special case for the short hop, say so — that is a sign the measurement is
being bypassed rather than used.

- [x] The pile and the drawn Card sit side by side, reading as two piles
- [x] The Card is no smaller than it is today, and every face still reads
- [x] »Im Zug« still has a sensible home, chosen deliberately
- [x] With no Card in force the played side is a dashed outline holding its shape
- [x] The effect sentence still reads full width, two lines reserved
- [x] The draw animates between the two, using the measured rectangles and no new special case
- [x] Nothing on the play screen shifts position between taps, including when a Card is drawn
- [x] At 390×844 with four Seats, the banner and a two-line effect, the Card and all six dice are
      visible with enough headroom to survive a real phone's browser chrome — number reported
- [x] Reduced motion still disables the draw, through the one hook
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped in `epic/table-and-presence`. The fold was measured in lane 14 rather than here: at 390×844
with four Seats, the banner up and a two-line effect the column asks for 795.3px and has 48.7px
spare, so the Card and all six dice clear a real phone's chrome. That lane also scales the Card with
the viewport, so on screens shorter than ~844 it is smaller than it was here — deliberate, and its
own ticket.

The dashed outline stays unticked because ticket 11 overruled it: the played side is a pile that
does not empty between Cards, so once anything has been played the space holds edges rather than an
outline. Only an untouched deck still shows the empty place.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
