# 03 — The Game does not end before the dice land

**What to build:** The Roll that wins the Game is one you actually get to watch. Today the play
screen is replaced by the result screen the instant the position says the Game is over, so the
winning dice never tumble at all — the most important Roll in the Game is the one nobody sees.

**Blocked by:** 01 — The Roll's news waits for the dice.

**Status:** ready-for-agent

## Why this is its own ticket

Tickets 01 and 02 hold back what the screen *says*. This one holds back the screen being **replaced**
— a different code path, and the one with the most to give away. It covers every way a Game ends:

- a Seat crossing the line and the Final round running out
- a **Kleeblatt** win, which ends the Game outright at any score and is the most dramatic moment the
  game has
- a Plus/Minus, which banks its flat 1000 and docks the leaders the moment its Tutto lands, so every
  score on the scoreboard jumps while the dice are still in the air

**Abandoning is not one of them.** A Player walking away is not an outcome anyone is watching dice
for; it should still take effect immediately.

- [ ] A Game that ends on a Roll shows that Roll's dice settling before the result screen appears
- [ ] A Kleeblatt win shows the winning dice before the result screen appears
- [ ] The scoreboard does not change until the dice that changed it have settled, including the
      Seats a Plus/Minus takes points from
- [ ] Abandoning still ends the Game immediately
- [ ] Every Seat at the table sees the ending at the same point in the animation
- [ ] Under `prefers-reduced-motion: reduce` the result screen arrives immediately
- [ ] A reload on the winning Roll replays the tumble before the result screen
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
