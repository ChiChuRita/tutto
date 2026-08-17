# 03 — Soft cards, and buttons you can press

**What to build:** The shape language of the reference: white panels floating on the pale ground with
wide soft shadows, generous radii, and buttons that look like they depress.

**Blocked by:** `01 — The table turns light`

**Status:** done

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

- [x] Content sits on white panels with soft shadows and no borders
- [x] Buttons are pills with a visible thickness that compresses on press
- [x] The press works on touch and does not interfere with press-and-hold on »Würfeln«
- [x] Slot heights are unchanged and nothing shifts when a button is pressed
- [x] Disabled moves read as unavailable, said in a colour rather than an alpha
- [x] The focus ring is clearly visible on every surface
- [x] The play screen does not scroll at the three viewports — numbers reported

## Comments

Shipped. `.pressable` gives a primary button a solid edge in its own colour with the light taken off
it (`--color-azure-deep`), and the face travels 3px down onto it on `:active`.

**`box-shadow` and never a border or padding**, because `--play-slot` is a reserved height the whole
fold budget is built on: a shadow paints outside the box and takes no space, so the slot is exactly
the height it was and nothing moves.

The press is `:active`, which a phone holds for as long as the finger is down — which is also what
»Würfeln« wants, since it is held for up to ten seconds to wind the dice up. The button looking held
for all of it is the correct reading.

**A real find on the way:** `disabled:bg-raised` was designed for a dark page where "raised" was a
quiet surface a step down. Inverted, it put every refused move on pure white — the loudest surface on
a light ground — so disabled buttons read as primary ones. They take the felt's tone now
(`--color-off`) so they sink into the table, with their own deeper ink because `--color-muted` only
reaches 3.95:1 there.

No reduced-motion gate on the press, deliberately: 3px in direct response to the Player's own finger
is feedback, not motion.
