# 11 — The played pile grows

**What to build:** The Cards you have drawn stack up. You see the one in force on top, the edge of
the one before it underneath, and when you draw again the new Card lands **on top of** the old one
instead of replacing it. The right-hand side of the stat row becomes a real pile that grows as the
Game runs.

**Blocked by:** None of the open tickets. Sequenced after `epic/table-and-presence` lands, since it
changes the played slot that epic just built.

**Status:** ready-for-agent

## This supersedes ticket 08

Ticket 08 deliberately chose a slot holding only the Card in force, on the grounds that a growing
pile is a second thing to size, to clear at the right moment, and to reason about across a TUTTO
chain. That call is overruled: the stacking is the thing that makes it feel like a table, and it is
what the two-piles idea was reaching for.

## What it looks like

The Card in force is on top and fully readable — nothing about reading the current Card may get
worse. Underneath it, the previous Cards show as edges: slightly offset, slightly rotated, the way a
real discard pile sits.

**Cap the layers you draw.** A Game can play 56 Cards and a pile of 56 rendered elements is waste.
Three or four visible layers reads as "a pile" exactly as well as forty does — this is the same
reasoning the draw pile already uses, where the count carries the truth and the stack is always
three layers deep.

The pile must hold a **fixed height** whether it has one Card or twenty. The play screen holds fixed
heights everywhere so nothing moves under the Player's thumb, and a pile that grows downward would
break that.

## What must not leak

ADR 0003 keeps the deck as counts, never an order, so a subscriber cannot see where the Cloverleaf
is. The played pile is different — those Cards are already public, you watched each one arrive. But
the rule still binds in one direction: **nothing about the played pile may say anything about what
is still to come.** Showing what has been played is fine; deriving it from, or exposing, the undrawn
deck is not.

## Across Turns

The pile is the Game's, not the Turn's. Cards played by every Seat land on it — that is what makes
it a table rather than your own hand. A new Turn does not clear it.

- [ ] The Card in force sits on top of the played pile, fully readable
- [ ] Previously played Cards show as offset edges beneath it
- [ ] Drawing lands the new Card on top of the pile rather than replacing a slot
- [ ] The number of rendered layers is capped, and the pile reads the same at 4 Cards and at 40
- [ ] The pile holds a fixed height and nothing on the screen shifts as it grows
- [ ] The pile persists across Turns and across Seats
- [ ] With no Card yet played, the space reads as an empty place for one
- [ ] Nothing about the played pile exposes or derives from the undrawn deck
- [ ] The draw still animates from the draw pile's measured position, with no new special case
- [ ] Reduced motion still disables the draw, through the one hook
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
