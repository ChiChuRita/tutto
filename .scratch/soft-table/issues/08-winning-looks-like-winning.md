# 08 — Winning looks like winning

**What to build:** The end of a Game should feel like the end of a Game.

**Blocked by:** `03 — Soft cards, and buttons you can press`,
`04 — Numbers live on pastel tiles`, `05 — Type with a voice`, `06 — Marks, not labels`

**Status:** ready-for-agent

## Why

A Game of Tutto can run for days and the whole of it is an argument about who won. The result screen
is the payoff for all of it, and right now it is a headline and a list. The Kleeblatt — a Card that
wins outright from any score, once in fifty-six — ends the Game on the same screen as a 6100-to-6050
squeaker, and they look identical.

## What to build

- **A winner's moment**: the name, big, with the crown mark (`06`), and the score that did it. It
  should arrive rather than appear — and it must arrive on the settled position, exactly as it does
  now, so the Roll that won is watched before it is announced (`no-spoilers 03`).
- **The final standings as tiles** (`04`), the winner's distinct from the rest.
- **The three endings read differently**: a win on points, a **Kleeblatt** win from any score, and a
  **tie**. A tie names everyone who tied. An abandoned Game is the fourth and quietest case: final
  scores, no winner, and it stays out of the record (`CONTEXT.md`).
- One clear way onward: back to the home screen, or straight into a new Game with the same Seats.

## What must not break

- **The settled position.** This screen replaces the play screen outright, so putting it up early
  would mean the winning Roll is never seen at all. It goes up on the settled position; abandoning is
  the one ending that does not wait, because nobody is watching dice for it.
- **Reduced motion**: a celebration that cannot be turned off is the worst possible thing to force on
  a Player who asked for stillness. One mechanism, the same hook as everything else.
- **Abandoned Games stay out of the record** and name no winner.
- **A tie is not an edge case** — `winners()` returns several Seats and the screen has to say so.
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [ ] A win has a moment: the winner's name, the crown, and the score, arriving rather than appearing
- [ ] The final standings read as tiles, with the winner's distinct
- [ ] Win on points, Kleeblatt win, tie and abandoned all read differently
- [ ] The screen still goes up on the settled position; abandoning still does not wait
- [ ] Everything it adds is off under `prefers-reduced-motion`, through the one existing mechanism
- [ ] There is one obvious way onward from it
