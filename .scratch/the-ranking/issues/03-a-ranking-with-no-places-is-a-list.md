# 03 — A ranking with no places is a list

**What to build:** Each row carries the place its Seat stands in.

**Blocked by:** None

**Status:** done

Three names and three numbers with one in bold reads as a list with a selection, not as a ranking.
Ticket `shared-table/02` closed with "Only a human can settle whether the three rows read as a
leaderboard rather than as a crowded row" — this is that question coming back answered.

The place is counted over **every** Seat, not over the rows on screen. The block is a window, so a
Player in last place of four sees places 2, 3 and 4; numbered off the slice they would read 1, 2, 3
and tell that Player they were third. `RankedSeat.place` is assigned in `ranking` after the sort,
before any caller slices.

Ties take strict places: two Seats level on 3400 read 2 and 3, not 2 and 2. The order is already
committed to on screen — the tie breaks on the Seat and one row is drawn above the other — so equal
numbers would say "level" where the rows say "above".

Set as `legend w-3 shrink-0 text-[0.55rem]`, the same figure `GameList.tsx` numbers its rows with,
"printed the way a form numbers its lines". Not `aria-hidden` the way that one is: a line number
carries nothing, but standing second in a Game of four is the point of ranking the rows at all.

**The height budget is untouched.** The places sit inside the existing row, so re-measuring against
`shared-table/02`'s table reproduces it to the tenth:

| viewport | rows | board | scrolls |
| -------- | ---- | ----- | ------- |
| 390x844  | 3    | 82.0  | no      |
| 390x800  | 3    | 80.2  | no      |
| 390x799  | 1    | 47.4  | no      |
| 375x667  | 1    | 45.6  | no      |
| 375x553  | 1    | 44.1  | no      |

- [x] Every row shows its place
- [x] The place is the Seat's standing in the Game, not its offset in the window
- [x] A Player in last place of four sees 2, 3, 4
- [x] Two Seats level on points take strict, distinct places
- [x] The dialog numbers its rows the same way
- [x] The board heights and the 800px switchover are unchanged, measured
<<<<<<< HEAD

## Comments

Landed twice, which is worth recording. The places went to `main` first in `34a6e46`, set as
`w-3 shrink-0 tabular-nums`, because that base had no `legend`. The Tippschein ground then brought
the vocabulary this ticket was written in, and the figure is now the `legend w-3 shrink-0
text-[0.55rem]` described above. Not `aria-hidden` in either.

The height table re-measured on the landed ground with six dice on the table: 82.0 at 390x844, 80.2
at 390x800, 47.4 at 390x799, 45.6 at 375x667, 44.1 at 375x553, nothing scrolling at any of them, and
all three rows running 18 to 372.
