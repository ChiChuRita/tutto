# 10 — A Niete you can feel

**What to build:** Throwing a Niete is the worst thing that happens in Tutto — every point banked
during the Turn is gone. Right now it is a line of text that appears while the dice are still
settling. It should land like a loss.

**Blocked by:** `no-spoilers` 01 — The Roll's news waits for the dice. The whole point is that the
blow arrives *when the dice stop*, not when the server answers. Built before that, it would announce
the Niete over dice still in the air.

**Status:** ready-for-agent

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

The Stop Card also ends a Turn with nothing, and that *is* a loss — but a quiet, bureaucratic one
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

- [ ] A Niete drains the Turn score to zero rather than swapping it
- [ ] The set-aside dice are visibly swept away
- [ ] The play screen takes one short jolt, by transform only
- [ ] All of it begins when the dice have settled, never before
- [ ] A Feuerwerk Niete reads as banking, not as loss, and keeps its own wording
- [ ] A Stop Card is unchanged
- [ ] Nothing shifts position and nothing is clipped
- [ ] Reduced motion gets the outcome with no movement
- [ ] A watching Player sees it identically
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
