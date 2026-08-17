# 10 — A Niete you can feel

**What to build:** Throwing a Niete is the worst thing that happens in Tutto — every point banked
during the Turn is gone. Right now it is a line of text that appears while the dice are still
settling. It should land like a loss.

**Blocked by:** `no-spoilers` 01 — The Roll's news waits for the dice. The whole point is that the
blow arrives _when the dice stop_, not when the server answers. Built before that, it would announce
the Niete over dice still in the air.

**Status:** done

## Show the points dying, not just a jolt

The loss is specific: the Turn's score goes to zero and the dice set aside to earn it stop counting.
So the animation should be **those things happening**, not a generic shake bolted on top:

- the »Im Zug« score falls to zero rather than being replaced by it
- the »Herausgelegt« dice are swept away — they were the Turn's winnings and they are forfeit
- a short, restrained jolt of the play screen underneath, once

A screen flash alone would say "something bad" without saying what. Showing the score drain and the
set-aside row empty says exactly what was lost, which is the thing that stings.

## Feuerwerk is not a loss

A Feuerwerk Turn can only end on a Niete, and it **pays out anyway** — the message today already
says so. It must not get the loss treatment: the Turn ends, the score survives, and the animation
should read as banking rather than losing. Getting this backwards would tell a Player they had been
robbed at the moment they were paid.

The Stop Card also ends a Turn with nothing, and that _is_ a loss — but a quiet, bureaucratic one
with no dice to blame. It keeps the current treatment; this ticket is about the Niete.

## The constraints this screen has already paid for

- **Nothing may shift.** Fixed heights everywhere, so the jolt must be a transform, never a
  layout change. The message line, the button slots, the dice grid's two rows and the set-aside row
  all hold their height.
- **Nothing may be clipped.** Each die's box reserves the room its cube sweeps through; an earlier
  bug that looked like clipping was dice painting over one another. A sweep-away that leaves the
  reserved room brings it straight back.
- **Reduced motion gets no movement at all** — no jolt, no sweep, no drain. The message and the
  emptied row are enough, and they arrive at once. One mechanism, the existing hook.
- **A watching Player sees the same thing**, from the same subscription, at the same point.
- The fold headroom is hard-won. This should cost nothing; if it costs anything, say how much.

- [x] A Niete drains the Turn score to zero rather than swapping it
- [x] The set-aside dice are visibly swept away
- [x] The play screen takes one short jolt, by transform only
- [x] All of it begins when the dice have settled, never before
- [x] A Feuerwerk Niete reads as banking, not as loss, and keeps its own wording
- [x] A Stop Card is unchanged
- [x] Nothing shifts position and nothing is clipped
- [x] Reduced motion gets the outcome with no movement
- [x] A watching Player sees it identically
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Three things happen and none of them is new machinery. The score drains through
`useCount`, which counts in whichever direction it is handed and does not know
this one is a loss. The row waits through the settled position, which was
already holding the position from before the blow. The jolt is one
`translateY`. The only rule added is a predicate — a Turn that lost its
winnings to the dice — and it lives in `message.ts` beside the sentence,
because the Feuerwerk exception is the same exception and one copy of it cannot
disagree with itself.

Nothing was added to `animationMs`. Every one of these starts on the frame the
news arrives — the frame `animationMs` has already delivered — so nothing waits
for them, and putting them there would hold the next tap back by exactly the
flourish meant to fill it. That is the argument `COUNT_MS` already makes in
`count.ts`, and the drain is one of the three.

**The row emptied 1103ms before it said so.** `Game.tsx` fed the row the live
position and the reducer clears `setAside` on a Null, so the dice vanished on
the frame the server answered — the loss announced by the only thing on screen
not waiting for the dice. The row now grows on the live position, because a die
set aside is on its way there and its flight is what the news waits for, and
empties on the settled one, because an emptied row _is_ the news.

Measured in headless Chrome at 390×844, four Seats, the banner up, driving the
real play screen off positions played through the reducer. The Niete: 1000 at
risk, three dice in the row, three in hand.

| at       | before               | after                                      |
| -------- | -------------------- | ------------------------------------------ |
| 18.5ms   | row empty            | row still holding its three dice           |
| 1120.6ms | »Niete!« (at 1121.8) | »Niete!«, and the loss starts here         |
| 1127.2ms | —                    | jolt begins, `translateY` −5.97px          |
| 1130.5ms | —                    | the three dice start moving right          |
| 1147.2ms | —                    | »Im Zug« 1000 → 950, in 50s                |
| 1322.2ms | —                    | jolt over, back to 0                       |
| 1430.5ms | —                    | the dice are gone, having travelled 55.1px |
| 1622.2ms | —                    | »Im Zug« reaches 0                         |

Nothing shifted and nothing was clipped. Every layout offset on the screen is
the same number before the Roll, during the jolt and after the sweep — the
column stays 862px, the grid at 444, the buttons at 734 — and the document stays
930×390 throughout, so the jolt bought no scrollbar in either direction. The
dice swept out to 195.1px on a 390px screen. Their boxes never overlapped by a
pixel at any frame: they move as one, so no die ever crosses another, which is
what would have brought the paint-order bug back.

The fold is untouched. With all six dice on the table the last one ends 198.4px
above it — the same 198.4 in the tree before this change, along with every other
measurement of the same position.

A Feuerwerk reads as being paid. It keeps its own line at 1125.4ms, takes no
jolt and sweeps nothing, and its »Im Zug« drains 2000 → 0 over exactly the frames
in which the Seat's own score climbs 6000 → 8000: a transfer, watched. A TUTTO
still empties the row at once and with no movement (28.5ms), because it has no
animation to wait for. A Stop-Karte is untouched in every sense: a Card is only
ever drawn onto an empty row, at the start of a Turn or after a TUTTO, so it has
never had dice to lose.

Reduced motion gets the whole outcome inside 24ms — the line, the emptied row
and the 0 — with the jolt never starting and the dice never moving. A Spectator,
off the same subscription with no Seat and no buttons, reads »Niete!« at 1120.9ms
and watches the row go at 1429ms: the same screen at the same point.

**A count is not as safe as it was claimed to be.** The epic review found the
`Counting` comment's reasoning false — a count does stay between its ends, but
the ends can be different widths, and this drain is the case, four digits landing
on one. The »Im Zug« tile was safe by accident (it is `flex-1`); the scores list
was not. The number's place is now reserved at five digits in `ch`, which with
tabular figures is exactly five of these digits. Measured with a Plus/Minus
docking three Seats from 1000 to 0 with the list open: the words beside each
score hold at 282.5px and 44.5px wide through every step, and the »am Zug« group
beside the paid Seat holds at 233.8px and 93.2px while its number counts 0 → 1000.
A six-digit score would widen the place as it crossed it; the `TODO` says so and
says what to do about it.

The scores dialog is also unmoved by the jolt: opened over a Niete, its rectangle
is identical on every frame while the column under it translates −5.99 to +3.98,
because a modal in the top layer does not inherit an ancestor's transform.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
