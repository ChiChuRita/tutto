# 01 — The Final round was a latch, so a Plus/Minus could end the Game at 5200

**What to build:** The letzte Runde is open exactly while some Seat holds 6000, read off the scores
rather than remembered.

**Blocked by:** None

**Status:** done

`bank` raised the phase to `finalRound` whenever a score crossed 6000 and never lowered it:

```ts
phase: seats.some((seat) => seat.score >= FINAL_ROUND_SCORE) ? "finalRound" : state.phase,
```

That is correct for every move except one. The Plus/Minus is the only move in the Game that takes
points off a Seat, and it can take the last Seat off 6000. The phase then said a last round was
running for a number nobody held, and the next levelling of Turn counts ended the Game.

Fixed at the one place any score changes. `bank` itself only ever adds, and `plusMinus` deducts from
the leaders *before* calling it, so every score change in the Game passes through `bank` exactly
once with the scores the whole move leaves behind. `roundFor` answers the phase from those:

```ts
const roundFor = (seats: Seat[], phase: GamePhase): GamePhase =>
  phase !== "playing" && phase !== "finalRound"
    ? phase
    : seats.some((seat) => seat.score >= FINAL_ROUND_SCORE)
      ? "finalRound"
      : "playing";
```

Only the two running phases are answered, so a lobby is not read for scores and an `over` Game is
never reopened. The Kleeblatt win overrides the phase after banking, as it did.

`bank` is not enough on its own, and finding out why cost a second round of this ticket. See the
`## Comments` below: a stored `finalRound` that no score supports is repaired at every Turn boundary,
because the Turn that would have ended such a Game banks nothing and so never reaches `bank`.

`settle` needed no change, which was the point of writing it as "run the move and see": it asks
whether `nextTurn` ends the Game rather than restating when a last round closes, so it inherited the
new answer.

- [x] A Plus/Minus that takes the last Seat off 6000 closes the round
- [x] Another Seat still at 6000 keeps it open
- [x] The Card's own 1000 counts, so it keeps the round open when that is the score left standing
- [x] Level Turn counts do not end a Game whose round has closed
- [x] The round is called again by whoever next reaches 6000
- [x] Verified in a browser against a real deployment, not only in the reducer
- [x] A Game already stored in `finalRound` with nobody on 6000 does not end on level counts
- [x] That stored phase is repaired whether or not the Turn banked anything

## Comments

Five tests in `turn.test.ts`, under `the Final round` > `closed again by a Plus/Minus`.

Verified end to end at 390x844 on `dev:majestic-puffin-957` from the exact position in the spec,
with the deduction made by clicking six dice and `HERAUSLEGEN` in the real UI. Marlene 6200 to 5200,
Ich 500 to 1500, Konstantin untouched, the `letzte Runde` banner gone from the screen, `Marlene ist
am Zug` where the winner announcement used to be, and the stored document reading `phase: playing`.

The banner needed no change. It renders on `said?.phase === "finalRound"`, so it goes when the round
does.

The ordinary path was checked too, since the fix touches the function every banked Turn goes
through. A solo Game played from the lobby on real server dice, driven through the real UI: 35
Turns of draw, roll, herauslegen and aufhören, ending on a triple of 1s that took it to 6500. It
crossed 6000, opened the round, and ended itself on the same move, with `phase: over` stored and the
winner screen up. Nothing scrolled at 390x844 at any point.

`evidence/before-round-open.png` and `evidence/after-round-closed.png` are the rule in two shots:
Marlene on 6200 under the `letzte Runde` band, then Marlene on 5200 with the band gone and `Marlene
ist am Zug` where the winner announcement would have been.

## Comments, second pass

The first pass put the check in `bank` alone and this ticket claimed a stored `finalRound` with
nobody on 6000 "corrects itself on the next banked Turn. No migration." That was wrong in the one
case that mattered, and the live deployment had the counter-example already.

Reading prod after deploying the first pass: six Games in `finalRound`, and one of them was

    sarisafari   5300   16 Turns taken
    ChiChuRita   3850   15
    phase finalRound, Turn over, Seat 1 to draw

A Plus/Minus had taken sarisafari off 6000 earlier in that Game, under the version that latched. The
Game's next event is `nextTurn`, which levels the counts at 16 and ends it. `nextTurn` changes no
score, so it never calls `bank`, so nothing corrected the phase first. Measured out of the reducer
with the first pass already in:

    after nextTurn: over [ 16, 16 ]

One draw away from awarding a real Game to a Seat on 5300.

Fixed by asking `roundFor` at the ending as well, and writing its answer back. Ending a Game is the
only decision the reducer cannot take back and `nextTurn` is the only move that takes it, so it is
worth the question there rather than trusting a stored field. For a Game whose phase is already
honest the write is the value the field already held, so nothing else moves.

Forward play never needed this: a Plus/Minus settles the round as it deducts. It is only reachable by
having played under the latch, which is exactly the population a fix has to survive.
