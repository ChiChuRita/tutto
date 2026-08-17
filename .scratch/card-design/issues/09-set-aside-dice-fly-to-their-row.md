# 09 — Dice fly to »Herausgelegt« when you set them aside

**What to build:** Tap »herauslegen« and the dice you chose travel from the hand down to the
»Herausgelegt« row, instead of vanishing from one place and appearing in another. The dice visibly
leave play.

**Blocked by:** None of the open tickets. Sequenced after the current epic lands.

**Status:** ready-for-agent

## When they fly

**On »herauslegen«, not on tap.** Selecting a die is reversible — you can tap it again and change
your mind — so animating on selection would mean animating a decision that has not been made, and
flying back on a second tap. Committing is the moment the dice actually leave the hand, and that is
what the animation depicts.

Choosing a die still needs to look chosen. That state exists today and stays as it is.

## What must not break

The play screen has been through a lot to stop moving under the Player's thumb, and this ticket adds
motion in the middle of it:

- **The dice grid reserves two rows always**, so the grid does not resize when dice leave the hand.
- **The »Herausgelegt« row is reserved from the start of a Turn**, so the first die set aside does
  not push everything below it down.
- Both must still hold. A die in flight must not shift anything, and it must not be clipped — each
  die's box already reserves the room its cube sweeps through, and a previous fix traced apparent
  clipping to dice painting over one another, so do not reintroduce that by animating outside the
  reserved room.

Reduced motion disables the flight, through the same hook everything else uses — one mechanism, not
two. With motion off the dice simply appear in the row, as they do today.

## How it fits what is already there

The Card's draw already measures its start and end rectangles and animates between them; the dice
tumble is a CSS keyframe replaying a server-decided result. This is the same idea again — a replay
of something already decided (ADR 0001), not a simulation. The server has already validated the
selection by the time anything moves.

Be careful about **what the flight implies before it lands.** A separate piece of work is making the
screen stop announcing outcomes before the dice settle; do not build something here that reveals a
Tutto, or the score, before the dice have arrived.

- [x] Committing a selection animates those dice from the hand to the »Herausgelegt« row
- [x] Selecting and deselecting a die animates nothing
- [ ] A die in flight is never clipped and never paints over another
- [x] The dice grid still reserves two rows, and the set-aside row still holds its height
- [x] Nothing on the play screen shifts position while dice are in flight
- [x] Reduced motion disables the flight, through the existing hook
- [x] A watching Player sees the same movement from the same subscription
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped in `epic/table-and-presence`. The flight is transform-only out of a berth the row already
holds, so nothing moves while dice are in the air; lane 14 measured the still frames at ten
viewports and found no two die boxes and no two berths sharing a pixel.

Clipping _during_ the flight is the one box left open. Nobody has measured a die mid-flight — lane
14 measured the phases it rests in — so it wants an eye on a running screen, or a capture partway
through the 400ms.
