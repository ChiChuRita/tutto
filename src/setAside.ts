/**
 * Where a die that has just been set aside flies from: the place in the hand it
 * was sitting a moment ago. Like the Card's draw, this is a replay of a move
 * the server has already made (ADR 0001) — the dice are out of play by the time
 * anything moves — so this is geometry and nothing else.
 *
 * A Roll repeats faces, and a watching phone never saw which dice were tapped,
 * so a landed die is matched to *a* hand die showing its face rather than to
 * the one the Player chose. Two dice with the same face are the same drawing,
 * so the difference cannot be seen; what matters is that no hand die is used
 * twice, or two dice would fly out of one place.
 */

import { flightStart, type FlightStart, type Rect } from "./flight";
import type { Face } from "./game/turn";

/** A die of the Roll still on the table: its face, and where it is. */
export type HandDie = { face: Face; rect: Rect };

/**
 * One flight per die just added to the »Herausgelegt« row, in that row's order.
 * A die with nothing to fly from — the hand was never measured, the face is not
 * in it, or motion is off and the hand is passed empty — starts where it lands,
 * which is `flightStart`'s way of saying the die is simply there.
 */
export function takeoffs(
  landed: readonly Face[],
  hand: readonly HandDie[],
  /** Where each landed die has come to rest, in the same order. */
  berths: readonly Rect[],
): FlightStart[] {
  // A hand die is spent once it has been flown out of.
  const spare: (Face | null)[] = hand.map((die) => die.face);
  return landed.map((face, index) => {
    const from = spare.indexOf(face);
    if (from !== -1) spare[from] = null;
    return flightStart(
      from === -1 ? null : hand[from].rect,
      berths[index] ?? null,
    );
  });
}
