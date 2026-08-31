# 01 — The record is a named block

**What to build:** An `<h2>Bilanz</h2>` over the whole record, `Bester Zug` included.

**Blocked by:** None

**Status:** done

`Stats.tsx` opens on a bare `<section>`. Its two siblings on the start screen do not:
`OpenGames.tsx:32` and `GameList.tsx:52` both carry `<h2 className="legend text-[0.6rem]">`. So the
start screen goes `<h1>Tutto</h1>`, headed panel, headed panel, unheaded panel, headed panel. WCAG
2.2 AA is binding (`PRODUCT.md`), and the record is also the block that block is hardest to name
from its contents: a figure and a list of people.

The word is `Bilanz`, which the app already uses for exactly this in `Account.tsx:104`: "dein
bester Zug und deine Bilanz gegen jeden Mitspieler." Not a fresh translation, and not a heading
that says something the copy elsewhere contradicts.

One heading covers both halves. `Bester Zug` is part of your record, not a section beside it, and
two headings over six numbers is more structure than the content has.

The heading renders whether or not there is anything under it, which is what `OpenGames` does: it
prints `Offene Spiele` above its own "nobody is waiting" sentence. See 04 for what sits under it
when the record is empty.

- [x] The record renders `<h2 className="legend text-[0.6rem]">Bilanz</h2>` as its first child
- [x] The heading is present in the empty state
- [x] The start screen has no unheaded block left on it

## Comments

Landed with the Tippschein ground, which is the only base it could land on: the vocabulary it is
written in (`field`, `field-machine`, `legend`, `receipt`, `reversed`) is that ground's. Ticket 05
went ahead of it in `34a6e46`, being a backend correctness fix that touches no ground.

## Comments, after the ground was reverted

This one survived the ground revert, re-expressed in Papier's vocabulary as
`<h2 className="font-display text-lg font-bold">Bilanz</h2>`. The complaint was never about the
ground: `Deine Spiele` and `Offene Spiele` carry an `h2` on Papier too, so the record was still the
one unheaded block on the start screen, and WCAG 2.2 AA is still binding. Kept for that reason
rather than because it was already written.
