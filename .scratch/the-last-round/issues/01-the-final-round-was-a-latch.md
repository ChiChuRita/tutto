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

A property that comes free: a Game already stored in `finalRound` with nobody at 6000, left there by
the old code, corrects itself on the next banked Turn. No migration.

`settle` needed no change, which was the point of writing it as "run the move and see": it asks
whether `nextTurn` ends the Game rather than restating when a last round closes, so it inherited the
new answer.

- [x] A Plus/Minus that takes the last Seat off 6000 closes the round
- [x] Another Seat still at 6000 keeps it open
- [x] The Card's own 1000 counts, so it keeps the round open when that is the score left standing
- [x] Level Turn counts do not end a Game whose round has closed
- [x] The round is called again by whoever next reaches 6000
- [x] Verified in a browser against a real deployment, not only in the reducer

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
