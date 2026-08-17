# Tutto

A mobile-first web version of the dice game *Tutto* (ABACUSSPIELE, 1994 — 2024 edition rules),
played by several people at once over an invite link. The interface is German; the code is English.

## The game in one paragraph

You roll six dice. Every roll has to leave at least one scoring die on the table, or it's a **Niete**
and the whole turn is worth nothing. Clear all six and you've made a **TUTTO** — take the points and
stop, or draw a card and roll all six again. The cards are what make it: a Bonus adds points, ×2
doubles the turn, and five of them take the choice to stop away entirely. First past 6000 doesn't
win; everyone else gets equal turns, and the highest score at the end takes it.

## Playing

Open the app, start a game, send the link to whoever's playing. Anyone holding the link can take a
seat — with an account, or as a guest with just a name. Arrive after it's started and you watch
instead, which is a real position here: Tutto has no hidden information beyond the undrawn deck, so
a spectator sees exactly what a player sees. Games are persistent and untimed; they can span days.

## Running it locally

```bash
npm install
npm run dev
```

`npm run dev` starts the Convex backend and Vite together, and provisions a dev deployment on first
run. You'll need a [Convex](https://convex.dev) account; the CLI walks you through it.

```bash
npm test        # the reducer, the scoring, the card faces, the animation budget
npm run lint    # typecheck + eslint
npm run build   # typecheck + production build
```

## How it's built

The rules live in `src/game/turn.ts` as a pure reducer — `(state, event) => state`, with **zero
imports**. Randomness is never generated there; it arrives as event payload, because the server
chooses every die and every card and the client only replays the result. That's what lets the same
function run on the backend as the authority and in tests as plain data, with no mocking and no
seeded RNG.

The screen deliberately lags the truth. `src/settled.ts` and `src/useSettled.ts` hold a *settled
position*: the state the animations have finished showing, which is what the UI renders. Without it
the app spoils its own outcomes — you'd read "Niete" a second before the dice landed on it.

Decisions that were expensive to reach are written down as ADRs in `docs/adr/`, and the domain
vocabulary — what counts as a Turn, a Seat, a Player, a Card in force — is in `CONTEXT.md`. Both are
worth reading before changing anything in their area.

- **Frontend** — React 19, Vite, Tailwind v4, `motion` for the dice and cards
- **Backend** — [Convex](https://convex.dev): the database, the game mutations, and auth
- **Tests** — Vitest, against the reducer and the pure modules around it

## A note on the artwork

Nothing here is traced from or imitates the published game's artwork. The card marks are drawn in
this repo. The card *colours* match the printed deck, and the German rule text on each card face is
the rulebook's own wording — Tutto is ABACUSSPIELE's game, and this is an unofficial implementation
of its rules, not affiliated with or endorsed by them.

## Licence

Apache-2.0. See `LICENSE.txt`.
