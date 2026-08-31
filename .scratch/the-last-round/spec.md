# Spec: The last round is a condition, not a latch

Status: done

## Problem Statement

The Game could end with nobody at 6000, and hand itself to a Seat on 5200.

Reaching 6000 opens the letzte Runde: play carries on until every Seat's Turn count is level, and
then the highest score wins. `bank` set `phase: "finalRound"` the moment any score crossed the
number, and nothing ever set it back. That is safe as long as scores only rise, and one Card breaks
that: the Plus/Minus takes 1000 off every Seat in the lead.

So this position was reachable, and reported by the user:

| Seat  | Score | Turns |
| ----- | ----- | ----- |
| A     | 6200  | 1     |
| B     | 100   | 0     |

B draws a Plus/Minus and gets its Tutto. A pays 1000 and stands on 5200; B takes 1000 and stands on
1100. Nobody holds 6000. But the phase is still `finalRound`, B's Turn levels the counts, and the
reducer declares the Game over. A wins on 5200 with the 6000 that called the last round no longer
anywhere on the table.

Measured before the fix, straight out of the reducer:

    scores [ 5200, 1100 ]   phase over   turnsTaken [ 1, 1 ]   winners [ 0 ]

## The rule

Stated by the user: **a Player who is knocked below 6000 by the Plus/Minus does not end the Game.
Play continues.** The last round is called again by whoever next reaches the number.

## Scope

- `roundFor` decides the running phase from the scores every time, in both directions.
- One second-order bug found while testing the endings in the browser: the final standings on the
  Result screen were in Seat order, so the last thing a Game said was the winner's name over a list
  that put whoever sat down first at the top.

Out of scope: what the letzte Runde does about Turn counts. Levelling is unchanged.
