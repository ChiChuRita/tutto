# 04 — Watching

**What to build:** The Game reads as a shared table rather than a form. Whose Turn it is is named
on every phone. The action buttons appear only on the active Seat's phone; everyone else watches
the dice tumble and the Cards arrive as they happen, on their own screen. Every Seat's score is
visible throughout, and the Final round is announced to everyone.

Someone who opens the link after the Game has started gets the full Game view and no Seat — a
Spectator. Tutto has no hidden information beyond the undrawn deck, so a Spectator sees exactly
what a Player sees. A Spectator is not a stored role; it is simply having no Seat in this Game,
so there is nothing to join and nothing to record.

Nobody can skip a Turn and nobody can remove a Seat. A Player who goes quiet for days leaves the
Game where it is; the only escape is abandoning it, which already exists and already keeps the
scores while naming no winner. Write this up as an ADR — the reason is invisible from the code:
the Final round is defined on equal Turn counts, so a skipped Turn breaks the 6000 rule, and a
timeout is exactly the kind of thing a later reader adds in good faith.

**Blocked by:** 03 — Joining from the link.

**Status:** ready-for-agent

- [ ] Every phone shows whose Turn it is, by name
- [ ] The action buttons appear only on the active Seat's phone
- [ ] A waiting Player sees Rolls, set-aside dice and drawn Cards animate as they happen, not as
      a jump between positions
- [ ] Every Seat's score is visible during play
- [ ] The Final round announcement reaches every phone
- [ ] Opening the link after the start shows the full Game with no action buttons and no way to
      take a Seat
- [ ] A Spectator's view updates live as the Game runs
- [ ] Abandoning is available to any seated Player and ends the Game for everyone
- [ ] There is no way to skip a Turn or remove a Seat, deliberately
- [ ] An ADR records that Turns are never skipped and why the Final round's Turn counts make it
      unsafe
