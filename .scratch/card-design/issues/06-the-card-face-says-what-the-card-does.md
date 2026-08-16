# 06 — The Card face says what the Card does

**What to build:** A Card's face carries its **meaning**, not its name. Plus/Minus shows the
thousand it gives and the thousand it takes. The Stop Card shows a stop sign. Feuerwerk shows a
burst, Straße shows the run, Kleeblatt shows a clover. The German name moves to small type; the
middle of the card says what happens.

**Blocked by:** None of the open tickets. Sequenced after the current epic lands, since it rewrites
the Card face that epic just built.

**Status:** ready-for-agent

## Why this reverses an earlier decision

The first design round chose "the face is the name, set large — no glyphs, no icon set", on the
grounds that eleven bespoke illustrations is eleven things to get right and the German words are
what a Player says out loud. That was the wrong call and it is being reversed. No ADR was written
for it precisely because it was cheap to reverse; this is that bet paying off.

**It also removes a defect rather than working around one.** `FEUERWERK` and `KLEEBLATT` are the
longest words in the deck and the hardest to size — they are currently broken across two lines at
14.6px, the smallest primary text on the screen, purely because a nine-letter word had to be the
largest thing on a 6rem card. Once the mark is a symbol, that problem stops existing. Expect to
delete the line-breaking and mark-sizing machinery, not to extend it.

## The faces

| Card | Face |
| --- | --- |
| Bonus 200–600 | the number, large — unchanged |
| ×2 | **×2**, large — unchanged |
| Plus/Minus | **+1000** over **−1000** |
| Stop | an octagon, the road-sign shape |
| Feuerwerk | a burst |
| Straße | the six dice faces 1–6 in a row — the run itself |
| Kleeblatt | a four-leaf clover |

**The Bonus Cards stay plain.** The number *is* the meaning — 200 through 600 is exactly what the
Card does — and an ornament added for visual consistency would cost the instant read for nothing.

Everything is drawn as CSS or inline SVG. All of it original: nothing traced from, or imitating,
the published ABACUSSPIELE artwork.

Straße's six pip-faces can reuse the existing die pip layout rather than being drawn again — the
app already knows how to draw a face of a die.

## What does not change

The three families and their colours: Bonus green, multiplier blue, forcing red. The frame, the
inset line, the corner indices and the pile all stay as they are. The effect sentence stays below
the Card, outside it, unchanged in wording — it is now the only place the rule is spelled out in
full, so it matters more, not less.

The face-to-Card mapping stays a pure function whose test covers all eleven, so a Card added to the
rules is a compile error until it has a face.

- [ ] Every Card's face shows its meaning: a number, a symbol, or the run
- [ ] The German name is present in small type, and the effect sentence still reads below the Card
- [ ] The Bonus Cards remain plain numerals
- [ ] Nothing on any face is traced from or imitates the published game
- [ ] Every face is legible at 390×844 — no primary mark smaller than the effect sentence below it
- [ ] The mark-sizing and line-breaking machinery is gone, not extended
- [ ] Family colours, frame, corner indices and the pile are unchanged
- [ ] The face mapping is a pure function with a test covering all eleven Cards
- [ ] Reduced motion, ADR 0001 and ADR 0003 all still hold
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
