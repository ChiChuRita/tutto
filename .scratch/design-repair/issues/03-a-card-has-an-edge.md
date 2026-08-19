# 03 — A card has an edge

**What to build:** A Card reads as a printed object on a pale table whatever colour it is printed in.

**Blocked by:** None

**Status:** done

## What the measurement actually said

A Card already carries `--shadow-soft` on `.card-frame`, so it is not edgeless — an earlier draft of
this ticket said it was and that was wrong. What the shadow does not do is bound the *ground*. It lifts
the Card off the page without ever drawing a line around the colour, so the palest ground bleeds into
paper while the saturated three do not.

| Card | ground on page |
| --- | --- |
| cobalt | 2.82:1 |
| ember | 2.70:1 |
| fern | 2.65:1 |
| **straw** (Kleeblatt) | **1.68:1** |

## Straw was a mustard, not a cream

`#d6b85c` is 49% lightness — the only warm mid-tone in a deck of clear hues, on a page that is faintly
blue. That is what read as dirty. The 2024 rulebook says cream, so the old value was already the less
faithful one.

The trilemma is real and none of the three legs is free:

- faithful cream → 1.06–1.17:1, the Card nearly vanishes
- object-strength → `#ab934a`, which is khaki and throws away the recognition `real-table 05` bought
- today's mustard → 1.68:1 and slightly dirty

Taken at `#e8d49a`: 1.28:1 on the page, ink up from 8.51:1 to **11.21:1**. Cream on paper cannot be a
strong object; that is a fact about cream and not a badly picked value. So the boundary comes from the
frame instead.

## The edge

An inset hairline of ink at 14% on `.card-frame`, on all four grounds. Inset, because a ring painted
outside would fall in the gap between two Cards lying on the pile. One value rather than a tint per
colour — it is the card's edge and not the colour's. Cobalt needs it least, cream needs it most.

- [x] Every Card has a boundary that bounds the ground and not just the shadow
- [x] Straw is nearer the rulebook's word than it was, and no other hue moved
- [x] `--color-ink` still clears 4.5:1 on all four grounds (5.07 worst, 11.21 best)
- [x] No dice land on straw — Straße is cobalt — so it owes nothing to `--color-die`
