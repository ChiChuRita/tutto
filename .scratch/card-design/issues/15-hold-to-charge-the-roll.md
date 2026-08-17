# 15 — Hold to charge the roll

**What to build:** Rolling stops being a tap and becomes a throw. Press and hold »Würfeln« and the
dice start spinning, faster the longer you hold, up to full speed at about ten seconds. Let go and
they settle — over a longer, heavier settle than the flick they have today.

**Blocked by:** None — everything it builds on is on `main`.

**Status:** done

## What the hold must not be

**Holding longer must not change the outcome, and the screen must not imply that it does.** The
server chooses the faces (ADR 0001) and it does so on release, from the same source as it does
today. A Player who holds for ten seconds and one who taps have exactly the same odds.

This matters more than it sounds. A charge bar that fills, or dice that visibly "power up", invites
the belief that winding up harder rolls better — and in a push-your-luck game that belief is
poisonous. The spin should read as **anticipation**, not as **charging a shot**. No meter, no
numbers, no green-to-red. Speed alone.

## The spin is decorative; the settle is the replay

While you hold, nothing has been decided — the dice are spinning on nothing, and that is fine. They
are not producing a result and must not appear to. On release the mutation runs, the server answers,
and the dice settle into the faces it chose. That is the same replay the tumble has always been.

A useful consequence: the spin naturally covers the round-trip. If the answer is slow the dice keep
spinning until it lands, so there is never a dead frame between letting go and the result.

## A tap must still roll

**Non-negotiable.** Press-and-hold is a gesture some people cannot perform — a tap, a keyboard
`Enter`, or an assistive click must roll immediately with the shortest spin. The hold is an
enhancement on top of a button that still works as a button. This is an accessibility basic and it
is not to be traded for the effect.

Also handle the phone realities: a finger sliding off the button mid-hold, the long-press context
menu, and text selection. None of them may leave the dice spinning forever or fire two rolls.

## The settle

Longer and heavier than today's 800ms flick — the dice have been going, so they should take a moment
to come down. The exact figure is yours to choose and to justify; it is a real cost, because it is
time before the Player learns the outcome. Say what you chose and why.

**Everything downstream must follow it.** `animationMs` in `src/settled.ts` is where the screen
learns how long it is moving, and the whole no-spoilers mechanism reads from it — the Turn message,
the score, the buttons, the Niete's drain and sweep. A longer settle that `animationMs` does not
know about announces a Niete over dice still coming down.

Note the tumble's duration lives in both `settled.ts` and the CSS keyframe, and there is now a test
that reads the stylesheet and fails if the two disagree. Keep it honest.

## Watchers

A waiting Player currently sees nothing until the Roll lands. With a ten-second hold available, that
becomes a long, unexplained pause. Show them that the active Seat is rolling — the dice spinning on
their screen too, from the same subscription. They should not see a charge level; that is the roller's
own business and it means nothing anyway.

## Reduced motion

No spin, no escalation. A press rolls, and the result arrives as it does today. One mechanism, the
existing `useReducedMotion` hook.

- [x] Holding »Würfeln« spins the dice, accelerating to a maximum at about ten seconds
- [x] Releasing rolls, and the dice settle into the faces the server chose
- [x] A tap, `Enter`, or an assistive click rolls immediately with the shortest spin
- [x] Nothing on screen suggests that holding longer improves the roll
- [x] The server chooses the faces on release, from the same source as today
- [x] A finger sliding off the button, a long-press menu, or a double fire cannot leave the dice
      spinning or roll twice
- [x] The settle is longer than today's, and the chosen figure is justified
- [x] `animationMs` accounts for the new settle, so no news arrives over dice still coming down
- [x] A watching Player sees the dice spinning while the active Seat holds
- [x] Reduced motion rolls on press with no spin and no escalation
- [x] The dice grid's reserved sweep room is unchanged, and no die paints over another at any speed
- [x] `src/game/turn.ts` and everything under `convex/` are unchanged except where the roll is
      triggered

## What was built

The spin is `spin.ts`: a speed in degrees a second and the angle that speed adds up to, and nothing
else — no level, no meter, no number the screen could print. Full speed is four turns a second at
ten, and the curve is eased so a two-second hold is already past a third of the way up. The angle is
worked out in closed form from the moment of the press, so a dropped frame, a backgrounded tab or a
slow mutation cannot leave the dice at an angle that depends on how the last few seconds happened to
be scheduled.

**The settle is 1200ms**, up from the 800ms flick. Dice that have been going do not stop in the time
a flick took. It costs 400ms per Roll before the Player learns anything, which is the argument
against going further; `animationMs` in `settled.ts` moved with it, along with the keyframe, and the
test that reads the stylesheet back keeps the two honest. It is the same length however long the
hold ran — it has to be, because a watching phone never saw the hold.

The button underneath is still a button. A tap, `Enter`, `Enter` leant on through key repeats, and
an assistive click each throw exactly once and at the shortest spin there is, which is none.

**Watchers**: the hold rides on the presence row as `rollingSince` — the moment of the press,
written once when the thumb goes down and cleared once the Roll it was for has landed, never in
between. A watching phone turns its dice from that timestamp, so every screen at the table shows one
wind-up at one speed. Written again mid-hold it would not refresh anything; it would restart the
watcher's spin from zero while the phone that made the hold showed none of it. What carries a long
hold instead is `WINDING_FOR_MS`, sized to outlast the charge, the round trip after it and a Player
leaning on the button.

**Reduced motion** is the one hook, `useReducedMotion`, and it answers for the _watcher_ as well as
the roller: a Player who asked for no movement is shown the dashed hand they saw before the hold
existed, not six cubes that cannot turn. A die that is not turning rests on the face it was handed
and reads that face out to a screen reader, and six of anything is a Tutto — off a Roll the server
has not been asked for yet.

Note on the last box: `src/game/turn.ts` is untouched, and so is every rules path under `convex/` —
the deck, the score, the Turn. `convex/presence.ts` and `convex/schema.ts` are not: the Watchers
section above needs a signal the rest of the table can read, and it is one optional field on the
presence row plus the mutation that writes it. Nothing about a Roll, a Card or a score moved, and
the wind-up says only that a thumb is down — never for how long.

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
