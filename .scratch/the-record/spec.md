# Spec: The record reads as a record

Status: done

## Problem Statement

The record is the last screen the Tippschein pass has not looked at. `.impeccable/review/` holds
before-shots of start, lobby, play, setaside, niete, scores, waiting and turn-on. There is no
shot of the record, and it shows.

What is on screen today (`evidence/before-full.png`, `evidence/before-one-opponent.png`,
`evidence/before-empty.png`, all at 390x844):

**It is the only unlabelled block on the start screen.** `Offene Spiele` and `Deine Spiele` each
carry an `<h2 className="legend text-[0.6rem]">`. The record carries none, so the page goes from
`<h1>Tutto</h1>` straight into unheaded panels. WCAG 2.2 AA is binding (`PRODUCT.md`).

**A number is abbreviated to fit its box.** Each opponent row ends in two `field-machine` boxes,
each 44px wide (`min-w-11`), holding the legends `Siege` and `Nlg.`. `Nlg.` is in neither the
`CONTEXT.md` wording table nor the rulebook: it is an abbreviation this app invented because
`Niederlagen` does not fit. Measured in the legend's own type at 390px: the row is 358px wide, each
box 44px, `Siege` sets 28px and `Niederlagen` would set 83px. So the second box would grow to about
100px and the pair would take 150px of the row, against 44px for the mark and whatever is left for
the name. `PRODUCT.md` principle 1 is "no invented vocabulary", and the interface voice "labels
things and does not narrate them". An abbreviation nobody says out loud is neither.

**A mark that is the same on every row is decoration.** Every opponent row carries the identical
`TILE.player` person icon in a 44px well. `tiles.ts` deleted five hues on exactly this reasoning,
in its own words: "It is the hue that was redundant." Then it kept a mark that is the same on
every row of a list. `OpenGames` repeats the same figure for the same reason, on the block whose
rows carry the most text.

**Nothing yet is said twice, and one of those times is a dash.** With no finished Games,
`Bester Zug` renders a bare em-rule in a machine well and the sentence below it explains that
there is nothing yet. Both come from the same fact: `bestTurn` is `null` exactly when `opponents`
is empty, because both derive from finished Games.

**Two smaller wrongs.** The comment at `src/Stats.tsx:55` says "Wins take the win tile and losses
the loss one" but the code gives both boxes plain `field-machine` with no mark, so it describes a
version that is gone. And `convex/stats.ts:115` falls back to `name: opponent?.name ?? ""`, which
renders a row with a record and no name. See ticket 05: that fallback covers two cases, not the
one this paragraph was written believing.

## Solution

The record becomes a named block whose rows say one thing each.

A heading, `Bilanz`, over the whole block including `Bester Zug`, in the same
`legend text-[0.6rem]` its two siblings use, present in the empty state the way `Offene Spiele`
is. `Bilanz` is the app's own word for this already: `Account.tsx:104` promises "dein bester Zug
und deine Bilanz gegen jeden Mitspieler."

The two number boxes collapse into one machine field reading `9:5`. Yours first, which is the
convention every sports table uses, and the row is your record, so no second reading is available.
`field-machine` is the right container because it is defined as "a total the form filled in rather
than something the Player wrote", which is what a derived record is. `Nlg.` goes with the box that
forced it.

That field carries no visible legend. This spec originally gave it `Bilanz`, which collided with
the block heading above: the same word once as the heading and again under every row, five times on
one screen. The heading names the figure and the orientation is convention, so the legend was
carrying nothing the heading was not.

What the legend was carrying, instead, is an accessible name, and WCAG 2.2 AA is binding. So the
glyph is `aria-hidden` and the words sit beside it in `sr-only` text: "9 Siege, 5 Niederlagen",
with German singulars ("1 Sieg", "1 Niederlage"). This is the one place the unabbreviated
`Niederlagen` fits, because it costs no width, so the record now says the word in full to the
Players most likely to need it spelled out.

`14 Spiele` shows only when it is not arithmetic. `statsFor` increments `games` on every shared
Game but only increments `wins` or `losses` on a clean result, so `games === wins + losses` unless
a Game was tied (won by more than one Seat, where "neither beat the other"). The count appears
exactly when it carries something the figure beside it cannot, and stays on the row's second line
where it is now. A third number in the figure is out: `CONTEXT.md` has no word for a tie, so there
would be nothing to label it with.

The person mark comes off both lists, the record's and `OpenGames`. It stays where it varies or
stands alone: `Account.tsx:68`, a single stub saying "this is you" among unlike panels, and
`Game.tsx:1258`, where the winner takes a different class.

In the empty state the field goes and the sentence stays, under the heading. One empty state, one
sentence, no dash.

## User Stories

1. As a Player using a screen reader, I want the record announced as a named section, so that it
   is not an unheaded panel between two headed ones.
2. As a Player, I want my losses called `Niederlagen` or not named at all, so that the app is not
   teaching me an abbreviation it made up.
3. As a Player, I want my record against someone as one figure, so that I read it instead of
   comparing two boxes.
4. As a Player, I want a row to show `Spiele` only when it is not my wins plus my losses, so that
   a number on screen is always telling me something.
5. As a Player, I want an opponent's name to have the row's width, so that a long name is not
   truncated to make room for an icon identical to the one above it.
6. As a Player with nothing finished yet, I want to be told so once, so that I am not reading a
   dash and a sentence that mean the same thing.
7. As a Player, I want every row in the record to name somebody, so that a record against nobody
   is not presented as a record.

## Non-Goals

- **No per-opponent screen.** The row is the head-to-head. `CONTEXT.md` defines it as "Games
  shared, wins, losses" and nothing more, and `statsFor` returns nothing else, so a screen would
  show the same three numbers larger. It also warns off "leaderboard, ranking, versus".
- **No new personal statistics.** `Bester Zug` stays the only one. Nothing here adds totals, win
  rates or history.
- **`GAME_LIMIT = 500` stays.** `convex/stats.ts:29` reads recent Games and refilters, so the
  query reruns when any Game anywhere changes. It is a deliberate shortcut whose ceiling and
  upgrade path (a `seatOwners` row indexed by User) are already written down, which is how a
  shortcut is meant to be left.
- **No change to `src/game/stats.ts`.** The tie test is `games !== wins + losses` in the
  component. All three numbers are already in the query's return, so no validator, schema or pure
  module changes, and `stats.test.ts` keeps covering unchanged behaviour.

## Stated Assumption

**Der Tippschein is the ground.** `.impeccable/questions/49671515.answer.json`, written
2026-08-21 12:39, records `challenger-hypercard` as a chosen direction with `buildPath: "code"`.
That is 69 minutes after `src/index.css` was last written, and nothing in `src/`, `docs/` or
`.scratch/` mentions hypercard. So a direction was picked and the build never started. This spec
assumes it was dropped: Tippschein is converted across all sixteen changed files, carries its own
written rationale, and had five follow-up commits polishing what it replaced.

If hypercard is in fact still ahead, every ticket here except 05 is throwaway and this spec parks.

## Comments

Landed in two pieces. Ticket 05 is a backend correctness fix, touches no ground, and went to `main`
on its own in `34a6e46` while the Tippschein ground was still in flight. Tickets 01 to 04 are
written in that ground's vocabulary (`field`, `field-machine`, `legend`, `receipt`, `reversed`) and
could not go anywhere without it, so they came with it.
