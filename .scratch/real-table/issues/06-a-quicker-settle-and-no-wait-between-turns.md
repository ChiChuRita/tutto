# 06 — A quicker settle, and no wait between Turns

**What to build:** Two things a Player said after playing the live site.

**Blocked by:** None — can start immediately.

**Status:** done

## 1. The dice settle too slowly

`TUMBLE_MS` is 1200, so a full hand of six takes 1500ms to come to rest, and every Roll of every
Turn spends it before the Player learns anything. **Shorten it.**

The comment above the constant argues _for_ 1200 — dice already turning when they are let go do not
stop dead, they come down — and names its own price in the same breath. The price is the part a
Player feels. That judgement is overruled by someone who has played it; keep the reasoning in the
file as the history of how the number moved, rather than deleting it.

The floor is real: the stagger is 60ms a die and six dice already spread 300ms of starts.

## 2. The next Player waits on a tap that does nothing

A Turn ends. The table then sits until the Player who has just finished presses »Neuer Zug« — a
Player who has stopped playing, and who may well have put the phone down. Only then can the next one
draw.

**The Seat up next should be able to draw straight away**, and drawing should close the finished Turn
in the same move.

Which makes »Neuer Zug« redundant rather than merely inconvenient: every Turn starts with a Card, so
closing the old Turn and drawing were always the same two taps in the same order. The first was a
step, never a decision. **Remove it**, and let the draw be the whole move.

## What must not break

- **ADR 0005.** A Turn may never advance without the Seat playing it — Turn counts are the Game's
  clock and the Final round ends when they level. This is not that: the Seat has played its Turn in
  full and it is over. Prove `turnsTaken` still moves exactly as it did, whoever taps.
- **The Final round can end on this very event.** Closing the last level Turn ends the Game, so there
  is no Seat up next and nobody may draw.
- **A solo Game.** The Seat up next is the Player themselves. With »Neuer Zug« gone, answer this
  wrong and a Player alone is left with a finished Turn and no button at all.
- **No spoilers.** The next Player's button may not appear before their own screen has finished
  showing the previous Turn's outcome — a Niete is decided the instant the dice are thrown, and a
  button arriving early announces it.
- The two halves of the hand-over are one transaction: no moment where the table has been passed on
  and nobody is holding it.

- [x] A hand of six settles noticeably quicker, and the reasoning for the old number is kept
- [x] The Seat up next can draw on a finished Turn without anyone else tapping first
- [x] Drawing closes the finished Turn in the same move, in one transaction
- [x] »Neuer Zug« is gone, and so is the mutation it was the only caller of
- [x] `turnsTaken` moves exactly as before, whoever closes the Turn
- [x] Nobody may take over when closing the Turn ends the Final round
- [x] A solo Player can start their next Turn
- [x] The scoreboard row names the Seat up next once the Turn is over
- [x] The take-over button is read off the settled position, not the live one

## Comments

**`TUMBLE_MS` 1200 → 800**, and `index.css`'s keyframe with it — the pair the stylesheet-reading test
keeps honest. A full hand of six goes 1500ms → 1100ms. The old argument is kept in the comment as
the history of how the number moved, because it was right about the mechanics and wrong about which
half a Player notices: the wind-up is what sells the throw, and the landing does not have to carry it
too.

**One pure function carries the hand-over.** `seatUpNext(state)` returns the Seat that plays once the
Turn on the table is closed, or `null` when there is none — and it answers by _running_ `nextTurn`
rather than restating its rules. That is what makes the Final-round case free: closing the last level
Turn ends the Game, `nextTurn` already knows it, and a second copy of that condition would be a
second chance to get it wrong. A test pins exactly that, and it is the only test that fails when the
condition is dropped.

**The server does both events in one mutation**, which in Convex is one transaction, so there is no
window where the Turn has been closed and nobody has drawn. It could not reuse `play`, because
`play`'s guard is the thing being stepped around: the Seat taking over is not the active one yet.
Everything else is `play`'s — same reducer, same write, same recording.

**The scoreboard had to move with it.** The row said »Anna ist am Zug« to the Player holding the only
button on screen. Once a Turn is over the table belongs to the Seat up next, so the row names them.

**Verified in two isolated browser contexts against a real deployment**, not just in tests. Anna
stopped on 100; without her touching anything, Bert's row read »Du bist am Zug« with »Karte ziehen«,
he drew, the deck went 55 → 54 and Anna's row flipped to »Bert ist am Zug« with no button. The run
happened to draw Bert a **Stop-Karte**, which ends a Turn on the same event it arrives — and the
table handed straight back to Anna with her own »Karte ziehen«, which is the hardest case in this
change and it was not staged. Solo checked the same way: a Stop-Karte ended the Turn and the button
was still there.

357 tests, lint, build and prettier clean. Both new predicates were checked against mutations that
should break them: letting anyone take over fails three tests, forgetting the Final-round end fails
exactly the one written for it.

**What only a human can settle:** whether 800ms now reads as too light rather than quick, and whether
losing »Neuer Zug« costs the Player who has just finished anything — their result now stays on screen
until the next Player draws, rather than until they dismiss it themselves.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
