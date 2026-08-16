# 04 — Real Cards

**What to build:** A Card looks like a card — portrait, framed, with its value large in the middle
and repeated small in the corners the way a playing card carries its indices, and a motif saying at
a glance which family it belongs to. The pile becomes a stack of the same cards, face-down.

**Blocked by:** 03 — Adopt motion.

**Status:** ready-for-agent

## The shape

Roughly 2:3, about **7rem tall**. The shape is what makes a card read as a card; the size is what
threatened the dice grid, and the two are separable. At this size the Card and the six dice both
fit above the fold on a phone.

This supersedes ticket 01's landscape strip, which was chosen to protect the dice before anyone had
a portrait card on screen to look at.

## The face

All of it original — nothing traced from or imitating the ABACUSSPIELE artwork:

- a rounded frame with an inset border
- the value large and centred
- a small repeat of it top-left and bottom-right
- one flat motif per family, drawn with CSS or inline SVG

The families and their colours are unchanged, and the rule that the face carries the name rather
than an icon set survives from the first round — eleven bespoke illustrations is eleven things to
get right, and the German words are what a Player says out loud:

| Family     | Colour | Face                                       |
| ---------- | ------ | ------------------------------------------ |
| Bonus      | green  | a small »Bonus« over **200**–**600**       |
| Multiplier | blue   | **×2**                                     |
| Forcing    | red    | **STOP**, **FEUERWERK**, **STRASSE**, **PLUS/MINUS**, **KLEEBLATT** |

*Straße* uppercases to **STRASSE** — the conventional German form, and the one place a UI string
will not match the glossary letter for letter.

The **forcing** family is the glossary's five, not the reducer's three. The two lists differ for
reasons already recorded in `CONTEXT.md`, and neither is wrong. Do not change the reducer to match.

## The pile and the back

The back keeps »TUTTO« and gains the same frame, so the pile and the drawn Card obviously belong to
one deck. The pile stays three layers deep whatever the count says — the count carries the truth, so
the stack must not twitch when the last Card drawn puts all 56 back in.

The effect sentence stays below the card, outside it, in the current small grey.

- [ ] A Card renders portrait, roughly 2:3, about 7rem tall
- [ ] The face has a frame with an inset border, corner indices, and a family motif
- [ ] All eleven Cards render with their family colour and mark
- [ ] The pile uses the same shape and frame, and pile and Card read as one deck
- [ ] The pile is three layers whatever the count, and does not react to the reshuffle
- [ ] The effect sentence still reads below the card, unchanged in wording
- [ ] Both the Card and the six dice are visible without scrolling at 390×844
- [ ] With no Card in force the slot holds its full height
- [ ] `cardFace` remains a pure function whose test covers all eleven Cards
- [ ] No artwork is traced from or imitates the published game
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
