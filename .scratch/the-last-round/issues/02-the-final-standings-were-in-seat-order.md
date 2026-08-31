# 02 — The final standings were in Seat order

**What to build:** The Result screen lists the finished scores highest first, from the same function
the table inside the Game uses.

**Blocked by:** None

**Status:** done

Found while browser-testing the endings for ticket 01. `Result` in `Game.tsx` mapped `seats` raw:

    GEWINNER Marlene
    Ich      5100
    Marlene  6200

The winner's name in the largest type on the screen, over a list with the loser at the top. Every
other list of these same scores ranks them: the collapsed rows on the play screen and the table
behind the tap both call `ranking`.

This is the same defect `34a6e46` fixed, in the one view it did not reach. That commit split
`leaderboard` into `ranking` plus a window so the two in-Game views could not drift apart; the
Result screen was not one of the two, and kept the Seat order it had always had.

Fixed by calling `ranking(game, null)` here too, rather than sorting on the spot. Asked with no Seat
of its own on purpose: this screen marks the winner, and which row is the reader's own is not a
question it has ever answered.

A Kleeblatt ending now shows its winner second, below a higher score. That is honest and stays: the
list is a table of scores, the crown marks the winner, and the reason line under the name says why a
lower score took it. The screen already carried a comment saying that ending "has to say why it
happened", and it does.

- [x] Highest score first
- [x] Ties keep both crowns
- [x] An abandoned Game still shows every score and crowns nobody
- [x] A Kleeblatt winner is crowned wherever their score puts them

## Comments

All four endings checked in the browser at 390x844: a win on points, a tie, a Kleeblatt from 4200
against 5800, and an abandoned Game reading `Kein Sieger`.
