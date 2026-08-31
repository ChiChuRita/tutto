# 01 — Revert the ground to Papier

**What to build:** The Tippschein ground comes off, Papier goes back on, and the logic and
correctness work landed on top of it stays.

**Blocked by:** None

**Status:** done

Done on a branch rather than on `main`, because `main` deploys to Pages on every push and a
half-reverted ground would have gone straight to the phone.

Three conflicts, all of them the same thing: `7189b64`'s ranked final standings meeting the revert.
Resolved by keeping the ranked iteration (`ranking(game, null)`, `row.seat`, `row.name`, `row.score`)
and taking Papier's styling for it (`shadow-soft`, `TILE.win.tile`, `bg-raised`, `font-display
tabular-nums`). One further conflict in a ticket file, and `PRODUCT.md`, which the revert wanted to
delete because `0280dad` created it.

`FINAL_ROUND_SCORE` goes back to being unexported. It was exported for the Tippschein value axis
under the table, and nothing outside the reducer reads it now. That is the whole of the reducer's
diff; `roundFor` and the ending check are untouched.

- [x] Papier's ground renders: warm stock, serif display, rounded pill, drawn dice with their tilt
- [x] The play screen does not scroll at any fold
- [x] The ranked dialog and its place figures survive
- [x] The final standings stay in score order, in Papier's vocabulary
- [x] Both reducer fixes untouched
- [x] The record heading, the empty-state sentence and the favicon carried across

## Comments

Verified in a browser at each fold. Nothing scrolls, and the dice grid's cell is 106.8 at 390x844,
100.3 at 390x800, 100.2 at 390x799, 80.8 at 375x667 and 64.1 at 375x553.

Screens checked: the empty start screen, the start screen with a Game on it, the lobby, the play
screen before and after a Roll, the ranked dialog, and the Result screen. The Result reads
`Gewinner Marlene` over `Marlene 6200 / Ich 5100 / Konstantin 3400`, score order, the winner's row in
Papier's amber win tile.

Build, lint, prettier and 408 tests clean. The CSS drops from 33.75 kB to 29.89 kB and the Archivo
woff2 leaves the bundle entirely.
