# 07 — The start screen becomes a home screen

**What to build:** The first screen stops being a list with a button on it and becomes the place you
are glad to land: who you are, how you are doing, and what there is to play.

**Blocked by:** `03 — Soft cards, and buttons you can press`,
`04 — Numbers live on pastel tiles`, `05 — Type with a voice`, `06 — Marks, not labels`

**Status:** ready-for-agent

## What is there now, and what the reference has

Now: a centred wordmark, a sign-in disclosure, a paragraph about what an account gives you, a
»Neues Spiel« button, the open tables, and a list of games. Everything the same size, in one column,
in one voice.

The reference opens with **an identity block** — avatar in a progress ring, name, one headline number
— then **a row of stat tiles**, then **content rows with a vivid Play pill on each**. There is a clear
first thing, second thing, third thing.

## What to build

- **An identity block.** The signed-in Player's name, and the one number worth boasting about — the
  best Zug, which the record already computes. A guest sees the invitation to sign up in the same
  place, at the same size, rather than as a paragraph above everything.
- **The record, as tiles** (`04`), moved up: best Zug, games played, and the head-to-head summary.
- **Open tables and your games as game-like rows** — a mark, who is at the table, and a vivid pill
  that says what tapping does (»Beitreten« for an open table, »Weiter« for a Game of yours in play,
  »Ansehen« for one that is over).
- **»Neues Spiel« as the screen's one loud action.**

## What must not break

- **A guest can still do everything they can do today**: create a Game, take a Seat, play it out. The
  account is an offer on this screen and never a gate — `multiplayer 05` decided that and it stands.
- **»Offene Spiele« stays signed-in-only** and stays lobby-only: a started Game refuses a Seat, so
  offering it would offer a move that does not exist.
- The start screen may scroll — it is the play screen that may not — but the identity block and the
  one loud action should be reachable without scrolling at 375×553.
- **`localStorage` is still what remembers this device's Games**, and the Seat secrets with it
  (ADR 0004). Nothing here changes how a Seat is held.
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [ ] The screen opens with who you are and one number worth seeing
- [ ] A guest sees the offer in that same place, and can still play a full Game without an account
- [ ] The record reads as tiles, not as a table
- [ ] Open tables and your own Games are rows with a mark, the Players, and one clear action each
- [ ] »Neues Spiel« is unmistakably the screen's primary action
- [ ] At 375×553 the identity block and the primary action are above the fold
- [ ] Nothing about how Seats or Games are remembered changes
