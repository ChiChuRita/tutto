# Spec: The table is shared — a live selection, and a leaderboard that moves

Status: ready-for-agent

## Problem Statement

Watching someone else's Turn is the quiet half of Tutto, and right now it is too quiet.

When the active Player picks up dice, nobody else sees it. Which dice they have chosen lives in a
`useState` on their phone and never leaves it. So a watcher sees a Roll, then a pause of unknown
length, then the dice have moved to »Herausgelegt« and the score has changed. The most interesting
part — someone deciding, changing their mind, reaching for a fourth die they probably should not
take — happens off screen.

The scores are worse. There is one row, and it says what _you_ have. Everyone else is behind a tap.
So the thing a push-your-luck game is actually about — that Anna just went past you, that you are
now second, that the leader is 900 ahead and you cannot stop yet — is information you have to go
and look for. When it does change, it changes by the number being replaced.

## Solution

A watcher sees the dice light up blue as the active Player chooses them, live, on their own screen.
Reaching for a die and putting it back is visible, because that hesitation is the game.

And the scoreboard becomes a small leaderboard: three rows, ranked, showing you, the Player above
you and the Player below. When you score, your number counts up — and if it carries you past
somebody, the two rows **swap places**, so overtaking is something you watch rather than something
you infer.

On a screen too short to afford three rows, it stays the single row it is today. The full list is
still one tap away.

## User Stories

### Watching a Turn

1. As a watching Player, I want to see which dice the active Player has selected, so that I can
   follow the decision instead of waiting for its result.
2. As a watching Player, I want the selection to update as they change their mind, so that
   hesitation is visible.
3. As a watching Player, I want the selection to look the way it does on their phone — blue — so
   that we are looking at the same table.
4. As a watching Player, I want the selection to clear when the dice leave the hand, so that stale
   highlights never linger.
5. As the active Player, I want my own screen to behave exactly as it does now, so that publishing
   my choice costs me nothing.
6. As a Spectator, I want to see the selection too, since I can already see everything else.
7. As a Player, I want tapping four dice quickly not to cost four round-trips, so that the table
   stays responsive on a slow connection.

### The leaderboard

8. As a Player, I want to see my score and the two Seats nearest me in rank, so that I know what I
   am chasing and what is chasing me.
9. As a Player, I want the rows ranked by score, so that "above" and "below" mean what they say.
10. As a Player, I want my score to count up when I bank, so that I see the size of what I won.
11. As a Player, I want to watch the rows swap when someone overtakes, so that changing position is
    an event and not a redraw.
12. As a watching Player, I want to see the swap happen on my screen too, at the same moment, so
    that we react together.
13. As the leader, I want three rows showing me and the two below, so that the leaderboard does not
    go half empty at the top.
14. As the Seat in last place, I want the two above me and myself, for the same reason.
15. As a Player in a two-Seat Game, I want two rows and no phantom third.
16. As a Spectator, I want the top three, since I have no position of my own.
17. As a Player on a small phone, I want the screen to keep fitting, so that a leaderboard never
    costs me the sixth die.
18. As a Player, I want every Seat's score still one tap away, so that the leaderboard summarising
    does not mean hiding.

### Not being lied to

19. As a Player, I want the leaderboard to change only when the dice have settled, so that a swap
    never tells me the outcome of a Roll I am still watching.
20. As a Player, I want a count and a swap to agree with each other, so that a row never moves
    before the number that moved it.

## Implementation Decisions

### The selection is published to its own table

Which dice are selected becomes shared state. It goes in **its own table, keyed by Game and Seat**,
never on the Game document — every device subscribes to that document, and a write per die tap would
re-render the whole table on every tap. This is the same reasoning that put the heartbeat in its own
table, and it is not negotiable.

Writes are **debounced**, around 150ms. A Player tapping four dice in a second should not produce
four round-trips, and nobody can perceive the difference.

The active Player's own screen keeps rendering from local state. Publishing is a side effect of
choosing, never the source of truth for the chooser — a laggy or failed write must not make your own
dice flicker.

The selection is **transient**: it clears when the dice leave the hand, when the Turn ends, and when
the Game does. A stale highlight on a Roll that no longer exists is worse than no highlight.

Nothing here is secret. The Roll is already public, so publishing which of it someone has picked up
leaks nothing — this is presentation, not a change to what the Game knows.

### The leaderboard is a window, not a list

Three rows, ranked by score: the Seat above, you, the Seat below. At the edges the window **slides**
rather than padding — the leader sees themselves and the two below, the Seat in last sees the two
above and themselves. Fewer than three Seats shows what exists and no phantom rows. A **Spectator**
holds no Seat and therefore has no neighbours; they get the top three.

Ranking replaces turn order in this row. Turn order is still carried by the »X ist am Zug« line and
by whose buttons are live, so nothing is lost by ordering these three rows the way a leaderboard is
ordered.

### Three rows are afforded, not assumed

The play screen fits the phone by a budget — `--room`, a `clamp` over the viewport, with every height
that may give taking a share of it. That budget is fully spent, and the single-row scoreboard is
what bought roughly 104px of it.

So the leaderboard is **three rows where the screen can afford them and one row where it cannot**,
on the same budget mechanism, applied to row count instead of pixel height. A large phone gets the
leaderboard; a small one keeps the fitting. The modal behind the tap is unchanged and still holds
every Seat, so the summary never means hidden information.

### The swap is a layout animation, and it is the library's job

Given stable keys and a changed order, the motion library animates a reorder itself. No module is
invented to describe a movement something else already performs.

This is the first layout animation in the app — an earlier ticket deliberately added none, because at
the time nothing changed place and inventing movement would have been a visible change nobody asked
for. Something changes place now, so the reason has expired.

### The number moves the row, not the other way round

A score counts through its values on the existing counting mechanism. **A row changes position at the
moment its counting number crosses its neighbour's** — so the swap is caused by the count, visibly,
rather than happening beside it. A row that moved before the number that moved it would read as the
app knowing something it has not shown you yet.

### It waits for the dice, like everything else

The leaderboard reads the **settled position**, as the scoreboard already does. A swap is an outcome,
and outcomes do not appear over dice still in the air. This is not a new rule; it is the rule the
whole play screen already follows, and the reason it must be stated is that a swap is the most
eye-catching outcome the screen has ever had.

### Reduced motion

No counting, no swapping, no reordering in flight: the rows are simply in their new order, and the
numbers are simply their new values. One mechanism, the hook that already exists.

## Testing Decisions

A good test here asserts something a Player could describe, never a shape or a class name. The prior
art is `src/scoreboard.test.ts` and `src/message.test.ts`: pure functions fed positions built through
the real reducer, asserting the answer. No mocking, no `convex-test`, no rendering, and none of that
changes.

**Seam 1 — `src/scoreboard.ts`, extended.** The three-row window is a pure derivation: Seats, scores
and this device's Seat in; ranked rows out. It already owns the collapsed row, so it is the same
module answering a bigger question rather than a new seam beside it. The cases worth testing are the
ones that will actually break: you leading, you last, exactly two Seats, one Seat, a Spectator with
no Seat, and **ties** — two Seats on the same score need a stable order or the rows will swap for no
reason on an unrelated change.

**No seam for the swap.** The animation is the library's, given keys and an order. Inventing a module
to describe a movement it already performs would be machinery for its own sake, and a test of it
would assert our description rather than the behaviour.

**A thin seam for the selection, and the spec says so rather than inflating it.** Publishing is a
table, a mutation and a query; the only logic worth a test is that a stale selection — from a Roll
that no longer exists — is not shown. Everything else is I/O and is verified by hand.

**Confirmed by a human, not by the suite**, stated per criterion: that a swap reads as an overtake
rather than a glitch; that the blue selection is legible on a watcher's screen; that the count and
the swap agree to the eye; and that three rows still fit the phones the budget claims they fit.

## Out of Scope

- Showing a watcher what the active Player is _about_ to do beyond selection — no pointer, no
  hover, no "thinking" indicator.
- Any change to what the Game knows or to the rules. `src/game/turn.ts` is untouched.
- A full ranked table of every Seat on the play screen; the modal already holds that.
- History or deltas — "+1150 since last Turn", position graphs, a Turn-by-Turn record.
- Sound.
- Reordering anything else by rank; turn order remains turn order everywhere else.

## Further Notes

This spec reverses part of an earlier one. Ticket `card-design 07` collapsed the scoreboard to a
single row **specifically** to buy the vertical space that made the play screen fit a phone, and
ticket 14 then spent that space down to 8.5px of margin at the smallest viewport. Three rows must
therefore be afforded rather than assumed, and any lane building this has to re-measure at 390×844,
375×667 and 375×553 and report the numbers. A leaderboard that quietly reintroduces scrolling would
undo two tickets to deliver one.

The selection table is the second side table keyed by Game and Seat, after `presence`. If a third
arrives, that is the moment to ask whether they should be one table with a per-Seat document rather
than three — not before.
