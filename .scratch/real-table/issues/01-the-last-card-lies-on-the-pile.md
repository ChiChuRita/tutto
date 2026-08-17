# 01 — The last Card lies on the pile

**What to build:** The Card you played before this one stays visible, face-up, under the Card in
force — offset a few degrees so both edges show. Drawing a new Card lands it on top of that one, so
you watch the pile grow instead of watching a Card vanish.

**Blocked by:** None — can start immediately.

**Status:** in-review

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

- [x] The Card in force sits face-up on top of the pile at its own angle
- [x] The Card played before it is face-up beneath, at a different angle, both edges visible
- [x] Older Cards remain blank edges
- [x] With no Card in force, the last played Card is the face on top
- [x] A fresh Game with nothing played shows the dashed outline
- [x] Every device shows the same angles, and a re-render does not change them
- [x] Drawing settles the old Card at once and lands the new one on top of it
- [x] The new Card's identity is still withheld until its flip
- [x] The pile holds a fixed height at any depth and nothing on the screen shifts
- [x] The play screen still does not scroll at 390×844, 375×667 or 375×553 — numbers reported
- [x] Nothing exposes or derives from the undrawn deck
- [x] `src/game/turn.ts` stays import-free; the reducer change is the one new field and nothing else

## Comments

Shipped on `rt-01-last-card`. One new field on the Game document — `lastCard`, the newest Card
played that the Turn is no longer holding — set by the two events that let a Card go: `draw` and
`nextTurn`. The reducer change is that field and nothing else, and `src/game/turn.ts` still imports
nothing.

The screen reads two faces off it (`cardOnTop`, `cardBeneath` in `cards.ts`): the Turn's own Card
while it holds one, `lastCard` once it has let go, and `lastCard` beneath while it holds one. So
with no Card in force the last played Card is the face on top, and the old empty-slot-over-edges
state is gone.

Angles come from `tiltOf(place)` in `pile.ts` — a Card's place in the pile, counted from the bottom
so a Card keeps its angle as the next one lands on it. Nothing random, nothing per render.

The draw needed no beat of its own: the old Card moving down a layer and the new one arriving are
one render, so the old one settles at once while the new is still face-down. `settled.ts` now keys
the draw on the top of the pile rather than the Card in force, so a TUTTO — which spends a Card
without moving it — no longer reads as a draw.

The Card beneath is dimmed (`.played-settled`): two Bonus Cards are two mints and the pile read as
one green mass without it.

Measured with a stubbed-backend harness in headless Chrome, four Seats, both leaderboard regimes.
No scroll at 390×844, 375×667 or 375×553 in any of seven positions — fresh, one Card, two Cards,
a deep pile, a spent Card, a handed-on Turn, and the Final round with the banner up. Pile height
constant per viewport at every depth: 96 / 72 / 57px, the same with nothing on it as with four
layers. Rightmost painted pixel 389 of 390 and 374 of 375, so nothing leaves the screen.
