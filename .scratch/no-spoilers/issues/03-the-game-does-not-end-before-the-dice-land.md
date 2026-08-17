# 03 — The Game does not end before the dice land

**What to build:** The Roll that wins the Game is one you actually get to watch. Today the play
screen is replaced by the result screen the instant the position says the Game is over, so the
winning dice never tumble at all — the most important Roll in the Game is the one nobody sees.

**Blocked by:** 01 — The Roll's news waits for the dice.

**Status:** ready-for-agent

## Why this is its own ticket

Tickets 01 and 02 hold back what the screen _says_. This one holds back the screen being **replaced**
— a different code path, and the one with the most to give away. It covers every way a Game ends:

- a Seat crossing the line and the Final round running out
- a **Kleeblatt** win, which ends the Game outright at any score and is the most dramatic moment the
  game has
- a Plus/Minus, which banks its flat 1000 and docks the leaders the moment its Tutto lands, so every
  score on the scoreboard jumps while the dice are still in the air

**Abandoning is not one of them.** A Player walking away is not an outcome anyone is watching dice
for; it should still take effect immediately.

- [x] A Game that ends on a Roll shows that Roll's dice settling before the result screen appears
- [x] A Kleeblatt win shows the winning dice before the result screen appears
- [x] The scoreboard does not change until the dice that changed it have settled, including the
      Seats a Plus/Minus takes points from
- [x] Abandoning still ends the Game immediately
- [x] Every Seat at the table sees the ending at the same point in the animation
- [x] Under `prefers-reduced-motion: reduce` the result screen arrives immediately
- [x] A reload on the winning Roll replays the tumble before the result screen
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

No new mechanism and no new duration. Ticket 01's settled position already knows
how long the screen is moving; this routes the last three readers of the live
position through it — the result screen, the scoreboard, and the banner — and
`settled.ts` itself is untouched.

Measured in headless Chrome at 390×844, driving the real play screen off scripted
positions out of the reducer. A watching Seat is simulated the way the table
really produces one: the Roll lands on it, and the move that ends the Game
arrives 300ms later, while its own dice are still falling.

| at                                   | before        | after                         |
| ------------------------------------ | ------------- | ----------------------------- |
| Kleeblatt win, 550ms                 | result screen | play screen, dice still going |
| Kleeblatt win, 1750ms                | result screen | result screen                 |
| Final round runs out, 550ms          | result screen | play screen, 6 dice tumbling  |
| Final round runs out, 1750ms         | result screen | result screen                 |
| reload onto the winning Roll, 400ms  | result screen | play screen, 6 dice tumbling  |
| reload onto the winning Roll, 1600ms | result screen | result screen                 |

The Seat that rolled it waits for nothing it has already watched: 120ms after the
ending lands on a phone whose own dice had settled, the result screen is up.
Abandoning is unchanged — the result screen at 320ms, mid-tumble, in both trees.
Under `prefers-reduced-motion: reduce` every ending arrives inside 80ms, before
and after alike.

The scoreboard, with a Plus/Minus banking 1000 and docking the leader 1000 on one
set-aside, read by the docked Seat 600ms into a tumble it is behind on: »Du:
11000« before, »Du: 12000« after, settling to 11000 when the dice stop. A
Feuerwerk ending on its Niete and banking past 6000 raised »letzte Runde« at
300ms before; after, the banner waits and comes up with the last die.

The fold is untouched: the dice end 198.4px above it at 390×844 with four Seats,
the banner up and the Kleeblatt's effect wrapping — the same in the tree before
this change, and the same again with the six dashed slots up instead of a Roll.

One thing a human should look at rather than take from a table. On a Kleeblatt
win the dice leave the grid with the move that wins, because the grid draws the
live Roll and a TUTTO hands every die back (ticket 01's rule, and the same for
every set-aside). So a phone that is behind holds the play screen — correctly —
but the last stretch of that wait is an empty grid rather than a turning die. It
is at most the lag that phone was already running at, and the alternative is the
result screen landing on dice mid-air, but it is worth seeing.
