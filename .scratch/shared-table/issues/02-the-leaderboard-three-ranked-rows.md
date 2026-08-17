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

- [x] The scoreboard shows the Seat above, you, and the Seat below, ranked by score
- [x] Leading shows you and the two below; last shows the two above and you
- [x] Two Seats shows two rows with no phantom third; one Seat shows one
- [x] A Spectator sees the top three
- [x] Two Seats on the same score hold a stable order across unrelated changes
- [x] Three rows appear where the viewport affords them and one row where it does not
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported
- [x] Every Seat's score is still one tap away, unchanged
- [x] The rows change only once the dice have settled
- [x] Nothing shifts position between phases
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## What the browser measured

Real headless Chrome over CDP, the play screen against a fixed position, the worst case ticket 14
set: four Seats, the »letzte Runde« banner up, an effect over two lines, six dice on the table and
six set aside, and this device holding the Seat whose Turn it is. »needs« is what the column asks
for with `min-h-dvh` taken off; »spare« is the viewport less that.

| viewport | rows | scoreboard | needs | spare | scrolls | needs before |
| -------- | ---- | ---------- | ----- | ----- | ------- | ------------ |
| 390×844  | 3    | 82.0       | 829.3 | +14.7 | no      | 795.3        |
| 412×915  | 3    | 82.0       | 829.3 | +85.7 | no      | 795.3        |
| 390×800  | 3    | 80.2       | 789.6 | +10.4 | no      | 756.8        |
| 390×799  | 1    | 47.4       | 755.9 | +43.1 | no      | 755.9        |
| 390×754  | 1    | 46.8       | 716.6 | +37.4 | no      | 716.6        |
| 375×667  | 1    | 45.6       | 640.6 | +26.4 | no      | 640.6        |
| 375×600  | 1    | 44.7       | 582.0 | +18.0 | no      | 582.0        |
| 375×553  | 1    | 44.1       | 544.5 | +8.5  | no      | 544.5        |

The collapsed rows reproduce ticket 14's figures to the tenth, so nothing below 800 has moved. »needs
before« is the same screen measured with the leaderboard switched off: the three rows cost 34.0px at
844 and 32.8 at 800, taken from the spare the budget already had and from nothing else — no die, Card
or button is smaller at any viewport.

800 is where that 34px still leaves a screen clearing by about the margin the smallest phone already
runs on (10.4px against the 8.5px at 553). It is read off `window.innerHeight`, which is the live
viewport `--room`'s `dvh` is measured from, so a Safari with its toolbars out gets the single row and
gets the leaderboard back when they slide away.

Also measured at 390×844: a Spectator sees the top three (Dana, Anna, Bernd) and »Du schaust zu.«
keeps its place on the turn line; two Seats show two rows and one Seat one row, with no phantom row
in either; the modal behind the tap still opens on all four Seats. The scoreboard sits at the same
top and the same height before and after the position settles, at all three viewports.

Only a human can settle whether the three rows read as a leaderboard rather than as a crowded row,
and whether losing them on a shorter screen feels like a loss.
