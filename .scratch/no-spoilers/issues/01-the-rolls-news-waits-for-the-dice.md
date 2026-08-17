# 01 — The Roll's news waits for the dice

**What to build:** Roll six dice and the screen tells you nothing until they land. »Niete!«, »TUTTO!«,
the Turn score dropping to zero, the buttons changing — all of it arrives when the last die settles,
not the instant the server answers.

Today every one of those renders at t=0 while the dice are still in the air, so the outcome is read
before it is seen. This is the same defect as the dice that used to glow when they scored: the
interface answering a question the Player is still working out.

**Blocked by:** None — can start immediately. Sequenced after the card-design epic's lane 05, which
rewrites the same screen.

**Status:** ready-for-agent

## The mechanism, which is the real work

The app has no notion of an animation being in flight. Every element reads the position from the
Convex subscription and renders it immediately. Fixing the message line alone would be one patch of
eight; what is missing is a single **settled position** — the position the screen renders, which
lags the true one until the animation for the newest event has finished.

Build that once and route the play screen through it. Every spoiler in this ticket and the next two
then disappears together, and there is one place to reason about rather than eight to remember.

Three constraints, all already decided elsewhere:

- **It is still a replay.** Animation shows a result the server already chose (ADR 0001). The lag is
  driven by the same mount-keying that makes a reload replay the tumble — not by a second mechanism
  and not by anything that decides outcomes on the client.
- **A watching Player lags identically.** Spectators and waiting Seats render from the same
  subscription, so the news must reach every phone at the same moment relative to its own dice.
- **Under `prefers-reduced-motion` the lag is zero.** There is no animation to protect, and holding
  news back from someone who has turned motion off is just a delay.

How long a position's animation runs is a pure function — the dice tumble is 800ms plus up to 300ms
of per-die stagger — and that function is the seam this is tested at. Mirror `dice.ts` and
`cards.ts`: pure, tested by construction, no rendering.

## What must wait for the dice

- The Turn message: »Niete! …«, »TUTTO! …«, »Zug beendet …«, »Stop-Karte! …«
- The »Im Zug« score, which currently snaps to zero on a Niete the moment the Roll arrives
- The action buttons, whose contents announce the outcome even though their space is now reserved —
  after a Null the only button left is »Neuer Zug«, after a Tutto it is »weitermachen«
- The six dashed slots that reappear on a Tutto before the dice that earned it have landed

## What must not wait

A refused move (»Das hat nicht geklappt«) answers a tap the Player just made and has no animation
behind it. It appears immediately, as now.

- [x] After a Roll, no message appears until the last die has settled
- [x] »Im Zug« does not change until the last die has settled
- [x] The action buttons do not change until the last die has settled
- [x] The dashed in-hand slots do not reappear until the last die has settled
- [x] A refused move still reports immediately
- [x] A watching Player sees the news at the same point in the animation the active Player does
- [x] Under `prefers-reduced-motion: reduce` everything arrives immediately, with no delay
- [x] A reload mid-Roll replays the tumble and the news still follows it
- [x] Animation durations are a pure function with its own tests
- [x] `src/game/turn.ts` and everything under `convex/` are untouched

## Comments

Shipped in `epic/table-and-presence`. The mechanism is `settled.ts` (`animationMs`, pure and tested)
with `useSettled.ts` holding the position back; the message line, »Im Zug«, the scoreboard, the
banner, the buttons and the Result screen all read it.

The dashed slots ticked late. The lane gated them on the live Roll but counted them from the settled
position, and setting dice aside clears the Roll in the same move that starts their 400ms flight —
so an ordinary set-aside of three painted six dashed slots, the signature of a TUTTO, and then
corrected to three. Fixed by asking both positions whether the table is clear.
