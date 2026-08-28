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
<<<<<<< HEAD

## Comments

Landed with the Tippschein ground. It does not apply to any other base: the reversed band it takes
off is that ground's, and on the ground that preceded it the collapsed rows had carried no band
since `shared-table/02`. So this ticket rode with the ground rather than going ahead of it in
`34a6e46` with the rest of the ranking work.
