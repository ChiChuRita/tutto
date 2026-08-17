# 12 — The reshuffle is the played pile being picked up

**What to build:** When the last Card is drawn, the played pile is picked up, turned face-down and
becomes the new draw pile. The moment the deck runs out stops being a number jumping from 1 to 56
and becomes the thing that actually happens at a table.

**Blocked by:** 11 — The played pile grows. There is nothing to pick up until the pile exists.

**Status:** ready-for-agent

## Why this is worth a ticket

Drawing the last Card puts all 56 back in the deck. Today the count simply jumps 1 → 56, and the
draw pile is deliberately built **not to react** to it — always three layers, because a stack that
suddenly grew back would look like a glitch.

Once the played pile is real, that is no longer a glitch to hide. It is the most physical thing in
the game: the discard pile gets picked up, turned over, and becomes the deck again. Showing it
turns the one moment the app currently papers over into the one moment that most looks like a table.

## What happens

The played pile lifts, flips face-down, and settles onto the draw pile, which returns to its normal
look with a full count. Then play continues.

It has to be **quick** — this happens mid-Turn, between a Player's tap and the Card they asked for.
It is a flourish on the way to the next Card, not a cutscene. Whatever it costs in time is time the
Player is waiting.

## The constraints

- **Nothing may shift.** Both piles hold their fixed heights throughout; this is a transform, not a
  layout change.
- **Reduced motion:** the counts simply change. No lift, no flip, no settle.
- **A watching Player sees it too**, from the same subscription — the reshuffle is a fact about the
  Game, not about one device.
- **ADR 0003 still binds.** The deck is counts, never an order. Nothing here may imply that the
  Cards go back in the order they were played, or expose any order at all — because there is none.
- The reshuffle already exists in the rules and the reducer owns it. This ticket shows it; it does
  not change when it happens.

- [x] Drawing the last Card plays the pick-up, flip and settle before the next Card is drawn
- [x] The draw pile returns to its full count and its normal look
- [x] The played pile is empty afterwards and reads as an empty place
- [x] It is quick enough not to feel like waiting
- [x] Nothing shifts position and nothing is clipped
- [x] Reduced motion changes the counts with no movement
- [x] Every Seat at the table sees it
- [x] Nothing implies or exposes an order in the deck
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped in `epic/table-and-presence`. The pick-up is 300ms, a quarter under the flight, because
every millisecond of it is a Player waiting mid-Turn; the Card they asked for then takes its usual
780ms on top. Whether that reads as a flourish rather than a wait is the one thing here only a
Player can say.

`animationMs` adds the two as `PICKUP_MS + DRAW_MS`, which is a frame or two short of what the eye
sees: a React round-trip sits between the pick-up finishing and the Card mounting and measuring
itself. The news lands in the last frames of the flip rather than just after it. Noted in
`settled.ts` rather than chased.
