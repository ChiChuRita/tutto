/**
 * Where a flight begins. Two things fly on the play screen — a drawn Card off
 * the pile into its slot (`Card.tsx`), and a die out of the hand into the
 * »Herausgelegt« row (`setAside.ts`) — and both ask the same question of the
 * same shape: the thing is already where it ends up, so what offset does it
 * have to start at to look as though it came from where it was?
 *
 * Both are replays of moves the server has already made (ADR 0001): the Card
 * was chosen server-side out of a deck that is only a count (ADR 0003), and the
 * dice are out of play before anything moves. So nothing here knows what flew,
 * only two rectangles — this is geometry and nothing else.
 */

/** As much of a `DOMRect` as a flight needs. `null` until it is measured. */
export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

/**
 * The transform a flight starts from, ending at nothing: `0, 0`. The offset and
 * never a scale, whatever the two boxes measure — a flying thing is drawn at
 * the size it lands at the whole way. Both callers want that and each has its
 * own reason, so each says so where it asks for the flight.
 */
export type FlightStart = { x: number; y: number };

/** Measured nothing, so start where you end: the thing is simply there. */
const STILL: FlightStart = { x: 0, y: 0 };

/** Present and laid out. A missing or zero-sized box has nothing to fly from. */
const measured = (rect: Rect): rect is NonNullable<Rect> =>
  rect !== null && rect.width > 0 && rect.height > 0;

export function flightStart(
  /** Where it was a moment ago: the pile, or the die's cell in the hand. */
  from: Rect,
  /** Where it now is: the Card's slot, or the die's place in the row. */
  to: Rect,
): FlightStart {
  if (!measured(from) || !measured(to)) return STILL;
  return {
    // Centre to centre, so it starts covering the place it came from.
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
  };
}
