# 01 — Cards get a design, and drawing one is animated

**What to build:** A Card stops being a text banner and becomes a card. The deck stops being a
number and becomes a stack you draw from. Drawing a Card is a visible act: it leaves the stack
face-down, travels to its slot, and flips face-up on arrival.

**Blocked by:** None — can start immediately.

**Status:** done

## The design, as settled

**The deck.** The »Karten« stat tile becomes a face-down stack: three offset layers, dark, the
word »TUTTO« centred on the top layer, and the count of Cards still to come on it. The stack is
always three layers regardless of the count — the number carries the truth. Drawing the last Card
reshuffles all 56 back in, so the count jumps 1 → 56; the stack must not react to that.

**The Card slot.** Full width, landscape, roughly 5rem tall, rounded. Card-_like_ rather than
card-shaped: a true portrait card pushes the six dice below the fold on a phone. The face carries
one large mark and nothing else. The effect sentence stays where it is today — below the card,
outside it, small and grey.

**The face is the name, set large.** No glyphs, no icons, no emoji. Three families by what the
Card does to you:

| Family     | Colour | Face                                                                |
| ---------- | ------ | ------------------------------------------------------------------- |
| Bonus      | green  | a small »Bonus« over **200**–**600**                                |
| Multiplier | blue   | **×2**                                                              |
| Forcing    | red    | **STOP**, **FEUERWERK**, **STRASSE**, **PLUS/MINUS**, **KLEEBLATT** |

A **forcing Card** is one that takes the choice to Stop away — the glossary entry for it was added
for this work. Note _Straße_ uppercases to **STRASSE**; that is the conventional German form and
the one place a UI string will not match the glossary letter for letter.

**The draw.** The Card slides out of the stack face-down, travels to the slot, and flips face-up
on arrival — flight and flip as two beats, not one compound 3D move. Animate `transform` only, so
it stays on the compositor, exactly as the existing dice tumble does.

**When it plays.** Mount-keyed, like the dice: a new Card mounts a new element and that is what
starts the animation. A page reload therefore replays it, which is the accepted, consistent
behaviour rather than a bug.

**The outgoing Card.** After a TUTTO the old Card simply vanishes and the new one flies in. No
exit animation — that would mean holding a dead Card in state, and after a TUTTO the eye is on
the six dice coming back. The empty slot keeps its height as a dashed outline, the same treatment
the empty dice slots already use.

This is a replay, not a simulation: the server chose the Card (ADR 0001), and the deck is stored
as remaining counts precisely so a stored order cannot leak where the Kleeblatt is (ADR 0003).
Nothing here may reach for the deck's contents.

- [x] Every one of the eleven Cards renders with its family colour and its large mark
- [x] The effect sentence still reads below the card, unchanged in wording
- [x] The deck renders as a three-layer face-down stack with »TUTTO« and the remaining count
- [x] The stack looks the same at 56 Cards and at 1, and does not react to the reshuffle
- [x] Drawing plays as flight then flip, ending face-up in the slot
- [x] Only `transform` (and opacity if needed) animates
- [x] `prefers-reduced-motion: reduce` disables both the flight and the flip, as it already
      disables the dice tumble
- [x] With no Card in force the slot is a dashed outline at full height
- [x] After a TUTTO the previous Card disappears and the new one animates in
- [x] The Card-to-family mapping is a pure function with a test asserting all eleven Cards map to
      a family, so a Card added later cannot render unstyled
- [x] The dice grid still fits above the fold on a phone-sized viewport

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".

**Superseded in part by `real-table 05`.** Colour is per Card now, read off the published
deck, rather than one colour per family. The family is still on the face — the motif carries it
alone. The box naming a family colour was true when it was ticked and is not the design today.
