# 01 — The last Card lies on the pile

**What to build:** The Card you played before this one stays visible, face-up, under the Card in
force — offset a few degrees so both edges show. Drawing a new Card lands it on top of that one, so
you watch the pile grow instead of watching a Card vanish.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Why this reopens a settled decision

The played pile currently draws buried Cards as **blank edges**, because the Game document holds the
deck as counts plus the Card in force and nothing else — so what is underneath is genuinely unknown.
That was accepted deliberately over recording the whole history, which would have grown the document
every device subscribes to by up to 56 entries.

Seeing it on a phone changed the ask, and the ask turns out to be much cheaper than the option that
was rejected: **one Card, not a list.** The Card just replaced goes on the Game document as a single
optional field. It does not grow over a Game, and it is the only new thing the position has to carry.

Read it out of the document, not out of the `turns` history — that would mean a second subscription
on the play screen for one value — and not out of client memory, which already failed once: a phone
joining mid-Game or reloading has none, and the pile must look identical on every device.

## What the pile shows

- **Card in force**, face-up on top, at its own slight angle.
- **The Card played before it**, face-up beneath, at a different angle so both edges show.
- **Older Cards**, as the blank edges they already are — the position still cannot say what they were.
- **With no Card in force** — the start of a Turn, and just after a TUTTO — the **last played Card is
  the face on top.** That is what a table looks like: the last card played lies there until someone
  plays another. It also removes today's odd empty-slot-over-edges state.
- **Nothing played yet**, in a fresh Game: the dashed outline, as now.

**Each Card lands at its own angle**, derived rather than random-per-render so every device shows the
same pile and a re-render does not reshuffle it. A few degrees is enough — the pile should read as
dealt, not scattered.

## The draw

The old Card **moves at once, on the draw**. Its leaving is not news — you already knew what it was —
so it settles onto the pile while the new Card is still face-down in the air. Only the new Card's
identity waits for its flip, which is how the effect sentence already behaves. The sequence then
reads correctly: the old one lands, the new one lands on it.

## What must not break

- **Fixed height.** The pile holds one Card's height however deep it is; the play screen holds fixed
  heights everywhere so nothing moves under the Player's thumb.
- **The fold.** Measure at 390×844, 375×667 and 375×553 and report — in both leaderboard regimes,
  since three rows appear only above 800px.
- **ADR 0003.** The deck is counts, never an order. The new field records a Card that has already
  been seen by everyone; nothing may expose or derive from what is still to come.
- Reduced motion still disables the draw, through the one existing hook.

- [ ] The Card in force sits face-up on top of the pile at its own angle
- [ ] The Card played before it is face-up beneath, at a different angle, both edges visible
- [ ] Older Cards remain blank edges
- [ ] With no Card in force, the last played Card is the face on top
- [ ] A fresh Game with nothing played shows the dashed outline
- [ ] Every device shows the same angles, and a re-render does not change them
- [ ] Drawing settles the old Card at once and lands the new one on top of it
- [ ] The new Card's identity is still withheld until its flip
- [ ] The pile holds a fixed height at any depth and nothing on the screen shifts
- [ ] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported
- [ ] Nothing exposes or derives from the undrawn deck
- [ ] `src/game/turn.ts` stays import-free; the reducer change is the one new field and nothing else
