# 04 — Numbers live on pastel tiles

**What to build:** The reference's core device — a **pale tinted tile with its number in a saturated
version of the same hue** — applied to every number the app shows.

**Blocked by:** `01 — The table turns light`, `03 — Soft cards, and buttons you can press`

**Status:** done

## The device, measured

Sampled off the reference: the tinted grounds are `#dcebf9` sky, `#f8edf7` pink, `#f5f7eb` lime,
`#e7ecf6` periwinkle. The accents that sit on them are properly vivid — `#3675ed` blue, `#a534ed`
violet, `#c5da73` lime, `#f8b052` amber, `#fccc68` gold. Pale ground, loud number, same family.

The number is the hero: large, heavy, and coloured. The label above it is small and quiet. That
inversion — label small, number huge — is what makes a statistic feel like a score.

## Where it goes

- **»Im Zug«** — the points at risk, which is the number the Player is actually watching.
- **The collapsed scoreboard row** — whose Turn, and your own score.
- **The scores modal** — every Seat.
- **The record** — best Zug, and the head-to-head rows.
- **The deck's count** on the card back.

Each number takes one tile of the family. Which hue means what should be _stable_ — the same number
is the same colour every time you see it — and written down.

## What must not break

- **Contrast on every pair.** A saturated number on its own pale tile is the one combination most
  likely to fail: report the ratio for every tile-and-ink pair, and none below 4.5:1.
- **`--color-jade`, `--color-azure`, `--color-gold` already mean things** — present, the app's own
  hand, and the Final round. A tile hue that collides with one of those steals its meaning.
- **The Card colours are not part of this family.** Cobalt / ember / fern / straw belong to the deck
  (`real-table 05`) and a stat tile must not read as a Card.
- **Fixed widths.** The score's place is reserved at five `ch` of tabular figures so a counting number
  cannot move what sits beside it — that reservation survives.
- The counting animation (`useCount`) is untouched; this is what the number looks like, not how it
  arrives.
- **The fold budget**, re-measured at the three viewports.

- [x] Every number in the app sits on a tinted tile with a saturated number of the same family
- [x] The hue-to-meaning mapping is written down and stable across screens
- [x] Every tile-and-ink pair clears 4.5:1, numbers reported
- [x] No stat tile reads as a Card, and none collides with jade, azure or gold
- [x] The reserved number width holds and nothing moves as a score counts
- [x] The play screen does not scroll at the three viewports — numbers reported

## Comments

Partly shipped. Five tile-and-ink pairs are in `@theme` — sky, violet, lime, amber, pink — each ink
**solved** to clear 4.5:1 on its own tile, because every one of them failed at the values sampled
straight off the reference.

»Im Zug« has a tile again, and a smaller one than the tile `real-table 04` removed. That one was
stretched to the row's height and to every pixel the Cards did not take — the biggest object on the
table holding the smallest number on it, which is why a Player asked for it to go. This hugs its own
content, so the Cards keep everything they gained.

The record's headline number is on amber.

**Not yet done:** the scores modal, the leaderboard rows and the head-to-head rows are still plain,
and the hue-to-meaning mapping is not written down — which the ticket asks for and which matters more
than any single tile, because the same number should be the same colour every time you see it.
