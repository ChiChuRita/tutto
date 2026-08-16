# 02 — Real cards, motion, and a layout that holds still

**What to build:** The Card becomes a card — portrait, framed, with its own design — and the draw
becomes a real draw: it lifts off the pile, travels, and turns over. The rest of the screen stops
moving underneath the Player, and the dice stop telling them which ones score.

**Blocked by:** 01 — Card design and the draw (merged). Also sequenced after multiplayer tickets
04 and 05, which rewrite the same parts of the play screen.

**Status:** ready-for-agent

## 1. Cards become real cards

Portrait, roughly 2:3, about **7rem tall**. The shape is what makes a card read as a card; the
size is what threatened the dice grid, and the two are separable — at 7rem both fit above the fold
on a phone. The pile uses the same shape, so the card that lands obviously came from it.

Give the face a design, all of it original — nothing traced from or imitating the ABACUSSPIELE
artwork:

- a rounded frame with an inset border
- the value large and centred
- a small repeat of it top-left and bottom-right, the way a playing card carries its indices
- one flat motif per family, drawn with CSS or inline SVG

The three families and their colours are unchanged from ticket 01, as is the rule that the face
carries the name rather than an icon set:

| Family     | Colour | Face                                       |
| ---------- | ------ | ------------------------------------------ |
| Bonus      | green  | a small »Bonus« over **200**–**600**       |
| Multiplier | blue   | **×2**                                     |
| Forcing    | red    | **STOP**, **FEUERWERK**, **STRASSE**, **PLUS/MINUS**, **KLEEBLATT** |

The back keeps »TUTTO« and gains the same frame, so the pile and the drawn card belong to one deck.
The effect sentence stays below the card, outside it.

This supersedes ticket 01's landscape format. Keep `cardFace` a pure function with its test — a
Card added to the rules must still be a compile error until it has a face.

## 2. The draw comes off the pile

The current flight starts from a **fixed, guessed** offset, which is why it does not read as
coming out of the pile — and it is visibly wrong when the »letzte Runde« banner is on screen.

Measure instead: take the pile's and the slot's real positions at draw time and animate between
them. Then travel, then turn over. It must be right under any layout, banner or no banner.

## 3. Use the motion library

Add `motion` and use it for this work and for movement generally — the draw, elements entering and
leaving, and layout changes. This is a deliberate reversal of ticket 01's CSS-only approach: the
measured draw, exit animations and layout animations are all things that would otherwise be
hand-rolled.

Leave the die's tumble in CSS. It is a `preserve-3d` cube rotating into a resting face, it already
works, and it stays on the compositor — motion adds nothing there. Dice entering and leaving are
fair game.

**Reduced motion is not optional.** Every animation added here must be disabled under
`prefers-reduced-motion: reduce`, as the dice tumble already is. Use the library's own hook rather
than a second mechanism.

## 4. The layout holds still

Nothing may move under the Player's thumb. Today the action buttons swap per phase and the
messages (TUTTO!, Niete!, the failure line) appear and vanish, so the page jumps between taps.

Reserve the space: fixed slots for the action buttons and for the message line, so what changes is
the content and not the geometry. A message slot that is empty most of the time still holds its
height.

## 5. The dice stop hinting

Valid dice currently render near-white and worthless ones grey, and the worthless ones are
`disabled`. Both go. Recognising what scores is the Player's job and part of playing the game.

Every die in the Roll looks the same and every die can be tapped. »herauslegen« refuses a selection
that does not score — which it already does, since the score preview comes from the same pure
function the server validates with. Removing only the colour while leaving the dice disabled would
not remove the hint, it would just make it quieter.

Dice already set aside keep their distinct, out-of-play treatment. Nothing about correctness
changes: the server has always validated, and the reducer is untouched by this ticket.

## 6. Nothing is clipped

A die appears to be cut off when it sweeps outside its box mid-tumble. **Diagnose it before
changing anything** — find what actually clips (an `overflow` up the tree, a box sized exactly to
the die while the rotating cube extends past it, a stacking or `perspective` boundary) and say what
it was. Then fix that, rather than adding room until it stops looking wrong.

The same applies to the card in flight: it must not be clipped by the slot, the stat row, or the
page.

- [ ] A Card renders portrait, roughly 2:3, about 7rem tall, framed, with corner indices and a
      family motif
- [ ] The pile uses the same shape and frame as the card, and both read as one deck
- [ ] All eleven Cards render with their family colour and mark; the effect sentence still reads
      below the card
- [ ] Both the card and the six dice are visible without scrolling on a 390×844 viewport
- [ ] The draw animates from the pile's measured position to the slot's, then turns over
- [ ] The draw is correct with the »letzte Runde« banner on screen
- [ ] `motion` is used for the draw, for entering and leaving elements, and for layout changes
- [ ] The die's 3D tumble is still CSS
- [ ] Every animation is disabled under `prefers-reduced-motion: reduce`
- [ ] The action buttons and the message line hold their space, so the layout does not shift
      between phases or when a message appears
- [ ] Every die in a Roll looks identical regardless of whether it scores
- [ ] Every die can be selected; »herauslegen« refuses a selection that does not score
- [ ] Nothing is clipped: a die mid-tumble, or a card mid-flight
- [ ] The cause of the clipping is named in the commit or a comment, not just worked around
- [ ] `cardFace` remains a pure function with its test covering all eleven Cards
