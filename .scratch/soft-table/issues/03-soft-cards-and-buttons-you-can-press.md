# 03 — Soft cards, and buttons you can press

**What to build:** The shape language of the reference: white panels floating on the pale ground with
wide soft shadows, generous radii, and buttons that look like they depress.

**Blocked by:** `01 — The table turns light`

**Status:** ready-for-agent

## What the reference actually does

Every group of content is a **white panel** on the tinted ground, with a large radius and a shadow
that is wide, soft and low-alpha — the panel floats a few millimetres above the page rather than
sitting in a box. There is no border anywhere. Grouping is done with elevation and whitespace only.

The buttons are the other half. They are **pill-shaped, saturated, and physical**: a solid darker
edge along the bottom that reads as thickness, and which compresses when pressed. That single detail
is most of the difference between "a web form" and "a game".

## What to build

- Panels: radius up, border gone, one soft elevation for resting and one for lifted.
- Buttons: pill radius, a bottom edge of the button's own colour darkened, and a press state that
  moves the face down onto the edge. Real `:active`, not a hover.
- The press has to work on touch, which has no hover, and must not fight the hold-to-charge gesture
  on »Würfeln« (`card-design 15`) — that button is held down for up to ten seconds.

## What must not break

- **Fixed heights.** `--play-slot` is the height a move gets, and the slot holds its height whether
  or not the phase offers the move. A button that grows by its own bottom edge changes that number —
  absorb it, do not let the screen move.
- **Nothing shifts on press.** The face moves; the slot does not.
- **The fold budget** and the three viewports, re-measured.
- **Focus stays visible.** The focus ring is `--color-azure` and it has to survive on a light ground.
- A disabled move must still read as unavailable without using opacity (the app says quiet in a
  colour, never an alpha).
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [ ] Content sits on white panels with soft shadows and no borders
- [ ] Buttons are pills with a visible thickness that compresses on press
- [ ] The press works on touch and does not interfere with press-and-hold on »Würfeln«
- [ ] Slot heights are unchanged and nothing shifts when a button is pressed
- [ ] Disabled moves read as unavailable, said in a colour rather than an alpha
- [ ] The focus ring is clearly visible on every surface
- [ ] The play screen does not scroll at the three viewports — numbers reported
