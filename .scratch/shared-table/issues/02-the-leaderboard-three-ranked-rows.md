# 02 — The leaderboard: three ranked rows

**What to build:** The scoreboard stops being one row about you and becomes a small leaderboard —
the Seat above you, you, and the Seat below — ranked by score. You can see what you are chasing and
what is chasing you without opening anything.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## A window, not a list

Three rows, ranked by score, centred on your Seat. At the edges the window **slides** rather than
padding:

- Leading: you and the two below.
- Last: the two above and you.
- Two Seats: two rows, and no phantom third.
- A **Spectator** holds no Seat and so has no neighbours — they get the top three.
- **Ties need a stable order.** Two Seats on the same score must not swap places because something
  unrelated changed. This is the case most likely to be got wrong and it is worth a test.

Ranking replaces turn order here. Turn order is still carried by the »X ist am Zug« line and by
whose buttons are live, so nothing is lost.

## Three rows are afforded, not assumed

**This is the part that will go wrong if it is rushed.** The play screen fits a phone by a budget —
`--room`, a `clamp` over the viewport, with every height that may give taking a share. That budget
is fully spent, and collapsing the scoreboard to one row is what bought roughly 104px of it. At the
smallest viewport the whole screen currently clears by **8.5px**.

So: **three rows where the screen can afford them, one row where it cannot**, on the same budget
mechanism applied to row count instead of pixel height. A large phone gets the leaderboard; a small
one keeps the fitting.

**Re-measure and report numbers at 390×844, 375×667 and 375×553.** A leaderboard that quietly
reintroduces scrolling undoes two tickets to deliver one.

The modal behind the tap is unchanged and still holds every Seat, so summarising never means hiding.

## It waits for the dice

The leaderboard reads the **settled position**, as the scoreboard already does. A rank is an
outcome, and outcomes do not appear over dice still in the air.

- [ ] The scoreboard shows the Seat above, you, and the Seat below, ranked by score
- [ ] Leading shows you and the two below; last shows the two above and you
- [ ] Two Seats shows two rows with no phantom third; one Seat shows one
- [ ] A Spectator sees the top three
- [ ] Two Seats on the same score hold a stable order across unrelated changes
- [ ] Three rows appear where the viewport affords them and one row where it does not
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported
- [ ] Every Seat's score is still one tap away, unchanged
- [ ] The rows change only once the dice have settled
- [ ] Nothing shifts position between phases
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
