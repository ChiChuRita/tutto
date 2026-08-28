# 02 — The emphasised row was the one out of alignment

**What to build:** The reversed band comes off the collapsed rows.

**Blocked by:** None

**Status:** done

The Seat whose Turn it was got `reversed rounded-tile px-1`. Measured at 390x844: that row's name
started at x=22 and its number ended at 368, while the two plain rows ran 18 to 372. So the one row
carrying emphasis was the one row inset by 4px on both sides, and in a column of three
right-aligned figures it was usually the leader's number that sat out of true.

The band had a second problem the code comment beside it had already argued itself into. That
comment explains the band was removed from *your own* row because "the line directly above says »Du
bist am Zug.«" and the row repeating it was redundant. The same holds for anybody else: the line
says "Marlene ist am Zug." and the band underneath said "Marlene", twice in adjacent lines.

So the band goes from these rows entirely. The rows are now one ranked block whatever the Turn
state, instead of two shapes depending on whose Turn it is, and the reversal — the loudest thing
this sheet can do — is spent only where nothing else says it: the dialog, which has no sentence
naming the Seat in play.

- [x] No row in the collapsed block is inset relative to its neighbours (measured: all 18 to 372)
- [x] No Seat's name appears twice in adjacent lines
- [x] The block has one shape whether or not the Turn is yours
- [x] The active Seat is still marked in the dialog

## Comments

This one does not apply to `main`. The reversed band it takes off was part of the Tippschein ground,
which was in flight in a working tree eight commits behind `origin/main` and never landed. On this
base the collapsed rows have carried no band since `shared-table/02` and all three already run 18 to
372, so there is nothing here to fix. The change and its measurements are real, and they are on the
`tippschein-wip` branch with the ground they belong to. Left in the tracker so the argument is not
lost if that ground lands.
