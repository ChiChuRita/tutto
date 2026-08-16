/**
 * Where a drawn Card's flight begins: on the pile, wherever the pile is. The
 * Card itself is a replay of one the server already chose (ADR 0001), and the
 * pile knows only how many Cards are left (ADR 0003) — so this is geometry and
 * nothing else.
 */

/** As much of a `DOMRect` as the flight needs. `null` until it is measured. */
export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

/**
 * The transform the flight starts from, ending at nothing: `0, 0`. Only the
 * offset — the pile and the slot are both `var(--card-width)`, so there is no
 * scale to travel through. If the pile is ever drawn at another size, that is
 * the moment to add one, not before.
 */
export type FlightStart = { x: number; y: number };

/** Measured nothing, so start where you end: the Card is simply there. */
const STILL: FlightStart = { x: 0, y: 0 };

/** Present and laid out. A missing or zero-sized box has nothing to fly from. */
const measured = (rect: Rect): rect is NonNullable<Rect> =>
  rect !== null && rect.width > 0 && rect.height > 0;

export function flightStart(pile: Rect, slot: Rect): FlightStart {
  if (!measured(pile) || !measured(slot)) return STILL;
  return {
    // Centre to centre, so the Card starts covering the pile's top card.
    x: pile.left + pile.width / 2 - (slot.left + slot.width / 2),
    y: pile.top + pile.height / 2 - (slot.top + slot.height / 2),
  };
}
