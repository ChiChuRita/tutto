/**
 * Where a die that has just been set aside flies from: the place in the hand it
 * was sitting a moment ago. Like the Card's draw, this is a replay of a move
 * the server has already made (ADR 0001) — the dice are out of play by the time
 * anything moves — so this is geometry and nothing else.
 *
 * A Roll repeats faces, and a watching phone never saw which dice were tapped,
 * so a landed die is matched to *a* hand die showing its face rather than to
 * the one the Player chose. Two dice with the same face are the same drawing,
 * so the difference cannot be seen; what matters is which *place* each one
 * leaves from, and that is decided here.
 *
 * ## Why the order is the whole of it
 *
 * The dice of one »herauslegen« all leave in the same beat and all run the same
 * 400ms, so their paths are fixed the moment the berths are: each is a straight
 * line from a cell of the grid to a place in a row that reads left to right. Two
 * of them cross exactly when the places they leave from are not in that same
 * left-to-right order — and a crossing is not a near miss. The gap between the
 * two closes evenly and reopens, so the dice pass clean through each other, and
 * `.die` carries `perspective`: every die is its own flattened stacking context,
 * siblings never interleave, and the one painted second lays its opaque faces
 * flat over the other along a hard straight edge. That edge is the bug that once
 * looked like clipping.
 *
 * Nothing at this end can undo it. A stagger cannot: the dice start spread the
 * width of the grid apart and land a berth apart, so a crossing happens in the
 * last quarter of the flight, where a spring is barely moving and no delay worth
 * having buys any distance. An arc cannot either, for the same reason — both
 * dice have to be
 * in their own berths at the end, so any detour has closed by the time it is
 * needed. What is left is not to cross, which is a question about the order the
 * row is filled in, and `inTableOrder` below is the answer to it.
 */

import { flightStart, type FlightStart, type Rect } from "./flight";
import type { Face } from "./game/turn";

/** A die of the Roll still on the table: its face, and where it is. */
export type HandDie = { face: Face; rect: Rect };

/** How far along the table a die sits, or `undefined` if it was never measured. */
const across = (rect: Rect): number | undefined => rect?.left;

/**
 * Places of the Roll, ordered left to right across the table.
 *
 * This is the order the »Herausgelegt« row is filled in, and it is not the order
 * the dice were tapped in. Taking it from the tap order is what sent two dice
 * across each other; taking it from the Roll's own numbering would only half fix
 * it, because a hand of six is laid out as two rows of three and the fourth die
 * of a Roll sits below the first, not right of the third.
 *
 * What the row gives up is nothing it was recording. The row's order is the
 * order dice were *set aside* in, and every die of one »herauslegen« is set aside
 * in one act — there is no order between them to lose. Tapping is not setting
 * aside: it is reversible, it animates nothing, and the app says so everywhere
 * else. What the row gains is that it now reads as the table read, left to
 * right, which is the arrangement the Player was looking at when they chose.
 *
 * Measured rather than worked out from the grid, so the row keeps agreeing with
 * the table if the grid is ever laid out differently. A hand that has not been
 * measured is left in the order it came in — the flight has nothing to go on
 * either, and a die with nowhere to fly from simply appears.
 */
export function inTableOrder(
  /** Places in the Roll: a selection, or the whole hand. */
  dice: readonly number[],
  /** Where each place of the Roll is, indexed by that place. */
  cells: readonly Rect[],
): number[] {
  if (dice.some((die) => across(cells[die]) === undefined)) return [...dice];
  return [...dice].sort(
    // Two dice in one column are one above the other, and either way round is
    // clear of the other's path. The upper one goes first, so a hand read this
    // way still reads downwards where it has the choice.
    (a, b) => across(cells[a])! - across(cells[b])! || a - b,
  );
}

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
  // The hand as the row was filled from it, so the dice that have just landed
  // are this walked from left to right with the ones left behind skipped over.
  const table = inTableOrder(
    hand.map((_, index) => index),
    hand.map((die) => die.rect),
  );
  // How far along that walk the last die left from. Every die after it comes
  // from further right, so no two flights cross — and a place already flown out
  // of is behind this, so no die flies out of a place a second time.
  let next = 0;
  return landed.map((face, index) => {
    const at = table.findIndex(
      (place, step) => step >= next && hand[place].face === face,
    );
    if (at !== -1) next = at + 1;
    return flightStart(
      at === -1 ? null : hand[table[at]].rect,
      berths[index] ?? null,
    );
  });
}
