# 03 — Adopt motion

**What to build:** Add the `motion` library and move what already animates onto it, so the app
behaves exactly as it does today and the library is in place for the Card work that follows.

Demoable as "the same app, still animating, nothing regressed". That is the point: adopting a
dependency and migrating existing animation is a different risk from designing a card, and it is
worth finding out separately whether reduced motion survives it.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## What moves onto motion

Elements entering and leaving, and layout changes. This is a deliberate reversal of the first
design round's CSS-only decision: a measured flight, exit animations and layout animation are each
things that would otherwise be hand-rolled, and the repo would end up with a worse version of what
the library does.

## What stays in CSS

**The die's tumble.** It is a `preserve-3d` cube rotating into a resting face, it works, and it
stays on the compositor. The library would add main-thread work and buy nothing. Dice entering and
leaving are fair game; the cube's rotation is not.

## Reduced motion

Every animation must remain disabled under `prefers-reduced-motion: reduce`, exactly as the dice
tumble already is. Use the library's own hook rather than leaving a second mechanism beside the
existing CSS media query — one mechanism, not two.

## Animation is still a replay

Nothing here changes ADR 0001. The server chose the Card and the faces; animation shows a result
that already exists. Nothing may reach for the deck's contents — ADR 0003 stores the deck as counts
precisely so a stored order cannot leak where the Cloverleaf is, and that includes presentation.

- [ ] `motion` is a dependency and is used for elements entering
- [ ] Leave and layout animations are NOT added here. Nothing in the app leaves or changes place
      with an animation today, so adding them would be a visible change, which the criterion below
      forbids. Ticket 02 reserves the space that would have moved; ticket 05 owns the one leave
      animation the spec wants — the spent Card giving way to the new one
- [ ] The die's 3D tumble is still CSS
- [ ] Every animation is disabled under `prefers-reduced-motion: reduce`
- [ ] Reduced motion runs through one mechanism, not two
- [ ] Nothing the Player can see behaves differently from before this ticket
- [ ] The production bundle size cost is reported in the commit message
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
