# 02 — One figure, not two boxes

**What to build:** `Siege` and `Nlg.` collapse into one machine field reading `9:5`, with the words
in full as its accessible name. `Spiele` shows only when it is not wins plus losses.

**Blocked by:** None

**Status:** done

Each opponent row ends in two `field-machine` boxes at `min-w-11`, one per number. That width is
what forced `Nlg.`, an abbreviation in neither the `CONTEXT.md` wording table nor the rulebook.
`PRODUCT.md` principle 1 says no invented vocabulary and the voice "labels things and does not
narrate them"; an abbreviation nobody says out loud is neither.

Measured at 390px, in the legend's own type (8px, weight 600): the row is 358px, each box renders
at its 44px minimum, `Siege` sets 28px and `Niederlagen` sets 83px. Widening the second box to hold
the full word puts it near 100px with its padding, so the pair takes about 150px of the row, next to
44px of mark and a truncating name. So the box goes instead of the word.

One field, figure `9:5`, no visible legend. Wins first: that is how every sports table is written,
and the row is the Player's own record, so there is no competing reading. `field-machine` stays
because `index.css` defines it as a total the form filled in rather than something the Player
wrote, which is what a derived record is.

The legend was going to be `Bilanz` until the build put it next to the `Bilanz` heading from ticket
01 and it read as the same word five times on one screen. The heading names the figure; the legend
was repeating it.

That leaves the figure without an accessible name, and WCAG 2.2 AA is binding, so the glyph is
`aria-hidden="true"` and the words go beside it in `sr-only`: `9 Siege, 5 Niederlagen`, with the
German singulars for one (`1 Sieg`, `1 Niederlage`). `sr-only` text costs no width, so this is the
one place in the row where `Niederlagen` fits unabbreviated.

`14 Spiele` on the row's second line is usually arithmetic. `statsFor` (`src/game/stats.ts:62`)
increments `games` for every shared Game but only increments `wins` or `losses` on a clean result,
so `games === wins + losses` unless a Game was tied, which is the "won by more than one Seat, so
neither beat the other" case. Render the count only when `games !== wins + losses`. It is a
property of the opponent, fixed for that row, so nothing appears and disappears as Games are
played. It stays on the second line rather than joining the legend, which is now one word.

A third number in the figure is out: `CONTEXT.md` has no word for a tie, so there is nothing to
label it with, and inventing one is the same mistake as `Nlg.`.

The comment at `src/Stats.tsx:55` describes these boxes as taking the win and loss tiles. They do
not, and after this ticket there is one box. Rewrite it to say what the field is.

- [x] An opponent row shows one machine field, figure `9:5` (wins first)
- [x] The figure is `aria-hidden` and the accessible name gives both words in full
- [x] The accessible name uses `Sieg`/`Niederlage` for one and the plurals otherwise
- [x] `Nlg.` appears nowhere in the tree
- [x] `Spiele` renders only when `games !== wins + losses`
- [x] A row for an opponent with a tied Game shows both the figure and the `Spiele` count
- [x] A row for an opponent with no tied Game shows the figure and no `Spiele` count
- [x] The comment above the field describes the field that is there

## Comments

Not on `main`. This is written in the Tippschein vocabulary (`field`, `field-machine`, `legend`,
`receipt`, `reversed`), none of which exists on this base: the ground was in flight in a working
tree eight commits behind `origin/main` and never landed. The work is real and it is on the
`tippschein-wip` branch. Only ticket 05, which is a backend correctness fix and touches no ground,
came across to `main`.
