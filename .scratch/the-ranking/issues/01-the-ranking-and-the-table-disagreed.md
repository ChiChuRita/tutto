# 01 — The ranking and the full table disagreed about order

**What to build:** The list behind the tap is ranked by the same function the rows on the play
screen are.

**Blocked by:** None

**Status:** done

The three rows on the play screen were in score order. The dialog behind the tap was in Seat order:
`Game.tsx` mapped `game.seats` raw while the rows above it called `leaderboard()`. So tapping a
<<<<<<< HEAD
ranking opened the same four numbers in a different order, and because the backdrop is translucent
=======
ranking opened the same four numbers in a different order, and because the backdrop is `bg-ink/40`
>>>>>>> fb9994f (Two lists of scores that disagreed, and a record that names its numbers)
rather than opaque, the ranked rows showed through behind the differently-ordered list. Both orders
were legible at once, which is the whole of why the view read as odd.

Never a decision. Ticket `shared-table/02` introduced ranking for the collapsed rows and wrote "The
modal behind the tap is unchanged"; ticket `card-design/07`, which built the modal, specified "every
Seat: name, score, and which one is active" and said nothing about order. The Seat order was
inherited from the version that predated ranking.

Fixed at the source rather than in the second caller: `leaderboard` was split into `ranking` (every
Seat in score order) and `leaderboard` (the three-row window on to it), so neither view sorts for
itself and they cannot drift apart again.

Turn order is not lost from the dialog. The `am Zug` label says it in words, which is where it
already was.

- [x] The dialog lists Seats in score order
- [x] Both views read from one function, so neither can be re-sorted alone
- [x] The active Seat is still marked in the dialog, and still says `am Zug` in words
- [x] A Spectator, who holds no Seat, gets a ranked list too
<<<<<<< HEAD

## Comments

Landed on `main` in two steps. The logic went first, in `34a6e46`, while the Tippschein ground was
still in flight: `ranking` and the places, and the dialog reading them, expressed in the vocabulary
that base had. The ground followed and brought its own, which is where the `bg-ink/40` backdrop
above comes from.

The dialog's rows also took the `ROW_SWAP` layout motion the collapsed rows have, because a ranked
list reorders under a Plus/Minus and rows that jumped while the block behind them glided would be
the one movement in the app arriving before its cause. It costs no bundle: `domMax` is already
loaded for those rows. The two comments claiming a single layout-animation site, in `App.tsx` and
`motion.ts`, are corrected with it.
