# 07 — The scoreboard opens on a tap

**What to build:** The scoreboard collapses to a single row you can tap. The row says whose Turn it
is and what you have. Tapping it opens every Seat's score in a modal; dismissing it returns you to
the table.

**Blocked by:** None of the open tickets. Sequenced after the current epic lands, since it changes
the scoreboard that epic just rebuilt.

**Status:** ready-for-agent

## Why

Right now every Seat gets a row, so a four-Player Game spends four rows of a phone screen on
information you glance at between taps. Measured: the scoreboard is worth about 104px at four
Seats, and the play screen currently clears the fold at 390×844 by **6px** — which does not survive
real Safari chrome, roughly 50–90px more.

So this is not only tidier, it is the change that actually makes the play screen fit on a real
phone. It is the structural fix where the epic's `gap-4`, 6rem Card and wrapped scoreboard were the
marginal one.

## What stays visible

**Whose Turn it is, and your own score.** Those are the two things a Player checks between taps.
Every Seat's score goes behind the tap.

A Spectator has no Seat and so no score of their own — the collapsed row still has to say something
useful to them.

## The modal

Every Seat: name, score, and which one is active, with your own marked as it is today. It is a
reading surface, not a control — there is nothing to do in it but look and dismiss.

Dismissing must work the ways people expect on a phone: the close control, tapping outside it, and
the Escape key. It must not be possible to leave it open and lose the Game behind it.

**It must not open by itself when the Game ends.** The result screen already shows every final
score; a modal on top of it would be two things saying one thing.

Reach for the platform before a library. A `<dialog>` element gives the modal behaviour, focus
handling and Escape for free, and this repo's standard is to use the native feature rather than add
code or a dependency for it.

## Accessibility is not optional here

The tappable row is a control and must read as one: reachable by keyboard, with a label saying what
it opens. Focus belongs inside the modal while it is open and back on the row when it closes.

- [ ] The scoreboard is one row showing whose Turn it is and your own score
- [ ] Tapping it opens a modal listing every Seat with name, score, and the active one marked
- [ ] The modal closes by its close control, by tapping outside, and by Escape
- [ ] The modal never opens by itself, including when the Game ends
- [ ] A Spectator, who has no Seat, still sees a meaningful collapsed row
- [ ] The row is keyboard reachable and labelled; focus enters the modal and returns to the row
- [ ] At 390×844 with four Seats, the »letzte Runde« banner showing and a Card whose effect wraps to
      two lines, the Card and all six dice are visible without scrolling, with enough headroom to
      survive a real phone's browser chrome
- [ ] Nothing on the play screen shifts position when the modal opens or closes
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
