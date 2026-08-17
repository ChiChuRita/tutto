# 03 — Dice that tumble

**What to build:** Rolling stops looking like numbers appearing and starts looking like dice being
thrown. Each die becomes a cube that tumbles along its own path and settles showing the face the
server already chose.

No rules change in this ticket at all. The animation is a replay of a decided result, per ADR 0001
— the faces are inputs to the animation, never outputs of it, so it is structurally incapable of
showing a face that disagrees with the score.

CSS 3D transforms only. No physics engine and no 3D library: this is a mobile-first app and the
animation has to stay smooth on a mid-range phone without shipping a large bundle. Swapping in real
physics later would not change the server contract, so that door stays open.

**Blocked by:** 02 — Play one Turn

**Status:** done

- [x] Each die renders as a cube with six faces and tumbles when rolled
- [x] Every die always settles on the face the server chose
- [x] Dice set aside are visually distinct from dice still in hand
- [x] Rerolling animates only the dice still in hand
- [x] The animation runs smoothly on a mid-range phone and does not block interaction
- [x] No physics engine, 3D library, or other new runtime dependency is added
- [x] Rules behaviour and all existing tests are unchanged

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
