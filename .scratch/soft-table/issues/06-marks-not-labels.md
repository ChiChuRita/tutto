# 06 — Marks, not labels

**What to build:** A small set of drawn marks — ours — so a tile or a chip says what it is before the
words do.

**Blocked by:** `03 — Soft cards, and buttons you can press`, `05 — Type with a voice`

**Status:** done

## What the reference does

Every tile and chip in it carries **one flat mark in a soft circular well**: a trophy, a crossed
sword, a controller, an hourglass, a star, a flame. They are what stops a column of statistics
reading as a spreadsheet, and they let a chip be small without becoming cryptic.

The app already draws marks this way and has the machinery: `Card.tsx` holds a flat, one-colour,
`currentColor` SVG per Card and per family, and `cards.test.ts` makes an unmarked Card a compile
error. This extends that vocabulary outward to the rest of the app rather than inventing a second
one.

## The set

Small and named, not open-ended. Enough for what the app actually has to label:

- a **die** — a Roll, a Turn, the best Zug
- a **crown** — a win, the leader
- a **clover** — the Kleeblatt, and luck generally
- a **flame** — a streak, a Feuerwerk
- a **hourglass** — a Game still running
- a **person** — a Seat, an opponent

Each in the same well the reference uses: a pale circle of the tile's own hue with the mark in the
saturated one.

## What must not break

- **Nothing is traced from or imitates the published game's artwork.** That rule has held since
  `card-design 01` and it holds here.
- **No dependency.** These are drawn in the repo, flat, one colour, `currentColor`, exactly as the
  Card marks are. An icon package is not the answer to six shapes.
- **A mark is decoration to a screen reader** where the label is beside it, and must carry a label
  where it is alone. No mark becomes the only way to know something.
- **The fold budget**: marks take space on the play screen, so re-measure.
- Contrast: a mark is type-weight ink on a tile and takes the same 4.5:1 as the number does.

- [x] Six marks exist, drawn in the repo, flat, one colour, no dependency
- [x] Each sits in a well of its tile's own hue, matching the number's family
- [x] Nothing is traced from or imitates the published game
- [x] Every mark is either decorative beside a label, or carries its own label
- [x] Marks clear 4.5:1 on the tiles they sit on
- [x] The play screen does not scroll at the three viewports — numbers reported

## Comments

Shipped as `src/Mark.tsx`: six drawings — die, crown, clover, flame, hourglass, person — flat, one
colour, `currentColor`, in a 24×24 box, traced from nothing and with no dependency added. A `switch`
rather than a lookup, so a name added to the union is a compile error rather than an empty square,
which is the pattern `Card.tsx` already uses for the Cards' own marks.

Deliberately **not** merged with the Card marks. A Card's mark is part of the printed deck; these are
part of the app, and the two should be free to move separately.

`aria-hidden` by default, which is the safe way round: nearly every mark here sits beside the word it
is about and read out would say it twice. A mark standing alone takes a `label`, and there is no
third option — so a mark cannot quietly become the only way to know something.

`MarkWell` is the circle a mark sits in, written once, so every mark in the app is the same size in
the same well.
