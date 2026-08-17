# 15 — Hold to charge the roll

**What to build:** Rolling stops being a tap and becomes a throw. Press and hold »Würfeln« and the
dice start spinning, faster the longer you hold, up to full speed at about ten seconds. Let go and
they settle — over a longer, heavier settle than the flick they have today.

**Blocked by:** None — everything it builds on is on `main`.

**Status:** ready-for-agent

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

- [ ] Holding »Würfeln« spins the dice, accelerating to a maximum at about ten seconds
- [ ] Releasing rolls, and the dice settle into the faces the server chose
- [ ] A tap, `Enter`, or an assistive click rolls immediately with the shortest spin
- [ ] Nothing on screen suggests that holding longer improves the roll
- [ ] The server chooses the faces on release, from the same source as today
- [ ] A finger sliding off the button, a long-press menu, or a double fire cannot leave the dice
      spinning or roll twice
- [ ] The settle is longer than today's, and the chosen figure is justified
- [ ] `animationMs` accounts for the new settle, so no news arrives over dice still coming down
- [ ] A watching Player sees the dice spinning while the active Seat holds
- [ ] Reduced motion rolls on press with no spin and no escalation
- [ ] The dice grid's reserved sweep room is unchanged, and no die paints over another at any speed
- [ ] `src/game/turn.ts` and everything under `convex/` are unchanged except where the roll is
      triggered
