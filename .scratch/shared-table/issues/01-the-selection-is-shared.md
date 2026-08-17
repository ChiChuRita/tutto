# 01 — The selection is shared

**What to build:** When the active Player picks up a die, everyone else sees it go blue on their own
screen — live, including when they change their mind and put it back. The most interesting part of
somebody else's Turn stops happening off screen.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Where it lives

Which dice are selected is currently a `useState` on the active Player's phone and never leaves it.
It has to be published, and a tap is a frequent event.

**Its own table, keyed by Game and Seat. Never the Game document** — every device subscribes to that
document, so a write per die tap would re-render the whole table on every tap. This is the same
reasoning that put the heartbeat in its own table, and it is not negotiable.

**Look before you add a table.** A sibling ticket (`card-design 15`, hold to charge the roll) is
publishing another piece of transient per-Seat state — that the active Seat is holding the roll
button — and may already have somewhere for it. Two tables is a coincidence; three is a pattern
worth collapsing into one per-Seat document. Check what landed, and if it fits, use it and say so.

**Debounce the writes**, around 150ms. Someone tapping four dice in a second should not make four
round-trips, and nobody can perceive the difference.

## The chooser's own screen must not depend on it

Publishing is a side effect of choosing, never the source of truth for the chooser. The active
Player keeps rendering from local state, so a slow or failed write cannot make their own dice
flicker or lag under their thumb.

## It is transient

The selection clears when the dice leave the hand, when the Turn ends, and when the Game does. A
highlight left over from a Roll that no longer exists is worse than no highlight at all.

Nothing here is secret: the Roll is already public, so publishing which of it someone has picked up
leaks nothing. This is presentation, not a change to what the Game knows.

- [ ] A watching Player sees the active Seat's chosen dice in blue, live
- [ ] Deselecting a die clears it on every screen
- [ ] A Spectator sees the selection too
- [ ] The selection matches what the active Player sees — same dice, same blue
- [ ] The active Player's own screen is unchanged, and never waits on the network to show a tap
- [ ] Tapping several dice quickly does not produce a write per tap
- [ ] The selection clears when the dice leave the hand, when the Turn ends, and when the Game ends
- [ ] Nothing is written to the Game document, and the play screen does not re-render on someone
      else's tap
- [ ] Queries read by index, never `filter`
- [ ] A device cannot publish a selection for a Seat it does not hold
- [ ] `src/game/turn.ts` is untouched — a selection is not part of the Game's position

## Comments

**A phantom selection, one Roll in 46,656, closed on review.** The published row named its Roll by
the faces alone, on the claim that two Rolls of a Turn always differ. They do not: a TUTTO hands all
six dice back, and so does the Seat's next Turn, so a later Roll can fall exactly as an earlier one
did — and nothing clears the row, so a watcher would light up dice nobody had picked up in the Roll
in front of them.

`rollKey` now names the position and not only the faces: the faces, the set-aside count, the Turn's
score and the Seat's Turns taken. Between them those three cannot repeat for one Seat — the
set-aside count grows with every Roll of one stretch, the Turn's score grows across the TUTTO that
clears it, and the Turns taken grows when the Turn ends. Both cases have a test.

**`publishSelection` no longer outlives the Game.** It was the one writer on this table that did not
gate on a finished Game, which left a public mutation behind nothing but a Seat's secret able to keep
a dead Game's row fresh — the thing `checkIn`'s read exists to prevent. The read is now in `said`
itself, once, for all three writers, so a fourth cannot be added without it. The cost is the one
`checkIn` already documented, now paid by every write here.
