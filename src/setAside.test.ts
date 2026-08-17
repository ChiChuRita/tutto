import { describe, expect, test } from "vitest";
import { inTableOrder, takeoffs, type HandDie } from "./setAside";
import type { Rect } from "./flight";
import type { Face } from "./game/turn";

/**
 * The layout this really runs in: three dice across a 390px phone, each in the
 * box its cube sweeps through, and the »Herausgelegt« row a few hundred pixels
 * below them holding dice a third of the size.
 */
const DIE_BOX = 100.8;
const SMALL = 36;

/**
 * The nth cell of the dice grid: three across, and a second row below for a
 * hand of more than three. So the fourth die of a Roll sits under the first and
 * is the leftmost thing on the table along with it, which is what an order taken
 * from the Roll's own numbering would get wrong.
 */
const inHand = (face: Face, cell: number): HandDie => ({
  face,
  rect: {
    left: 22 + (cell % 3) * 122.6,
    top: 420 + Math.floor(cell / 3) * 122.6,
    width: DIE_BOX,
    height: DIE_BOX,
  },
});

/** The nth place in the »Herausgelegt« row. */
const berth = (place: number): Rect => ({
  left: 16 + place * 44,
  top: 700,
  width: SMALL,
  height: SMALL,
});

/** Where each cell of a hand is, which is what the row's order is taken from. */
const cellsOf = (hand: readonly HandDie[]) => hand.map((die) => die.rect);

/** Centre to centre, which is what a flight is. */
const offset = (from: HandDie, to: NonNullable<Rect>) => ({
  x: from.rect!.left + DIE_BOX / 2 - (to.left + SMALL / 2),
  y: from.rect!.top + DIE_BOX / 2 - (to.top + SMALL / 2),
});

describe("where a set-aside die flies from", () => {
  test("the die comes out of the place in the hand that showed its face", () => {
    const hand = [inHand(2, 0), inHand(5, 1), inHand(3, 2)];
    const [flight] = takeoffs([5], hand, [berth(0)]);
    expect(flight).toEqual(offset(hand[1], berth(0)!));
    // Up the screen and to the left of where it lands: the hand is above the
    // row, and the middle cell is right of the row's first place.
    expect(flight.y).toBeLessThan(0);
    expect(flight.x).toBeGreaterThan(0);
  });

  test("a Drilling: three dice of one face leave from three different places", () => {
    const hand = [inHand(1, 0), inHand(1, 1), inHand(1, 2)];
    const flights = takeoffs([1, 1, 1], hand, [berth(0), berth(1), berth(2)]);
    expect(flights).toEqual([
      offset(hand[0], berth(0)!),
      offset(hand[1], berth(1)!),
      offset(hand[2], berth(2)!),
    ]);
    // No hand die flown out of twice, which would be two dice from one cell.
    expect(new Set(flights.map((flight) => flight.x)).size).toBe(3);
  });

  test("dice already in the row are not disturbed: only the new ones are asked for", () => {
    // Two 1s were set aside earlier; this Roll adds one more. The row's own
    // slice is what arrives here, so the older dice have no flight at all.
    const hand = [inHand(1, 0), inHand(4, 1)];
    expect(takeoffs([1], hand, [berth(2)])).toHaveLength(1);
  });

  test("a face that is not in the hand: the die is simply there", () => {
    // A phone that opened the Game after the Roll had gone never measured a
    // hand, so there is nowhere to fly from and nothing to animate.
    expect(takeoffs([6], [], [berth(0)])).toEqual([{ x: 0, y: 0 }]);
    expect(takeoffs([6], [inHand(2, 0)], [berth(0)])).toEqual([{ x: 0, y: 0 }]);
  });

  test("reduced motion is an empty hand: every die is simply there", () => {
    const flights = takeoffs([1, 5], [], [berth(0), berth(1)]);
    expect(flights).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  test("a die that has not been laid out yet: simply there, not flung", () => {
    // The row is measured in the same beat the die is added to it, so a berth
    // can be missing or unsized. Either must not throw the die off the screen.
    const hand = [inHand(5, 0)];
    expect(takeoffs([5], hand, [])).toEqual([{ x: 0, y: 0 }]);
    expect(takeoffs([5], hand, [null])).toEqual([{ x: 0, y: 0 }]);
  });

  test("a TUTTO clears the row, so nothing lands and nothing flies", () => {
    expect(takeoffs([], [inHand(1, 0)], [])).toEqual([]);
  });
});

/**
 * Two dice in the air at once must not pass through each other. `.die` carries
 * `perspective`, so every die is its own flattened stacking context and siblings
 * can never interleave in 3D: one crossing the other paints its opaque faces
 * flat over it along a hard edge, which is the bug that used to look like
 * clipping.
 *
 * Every flight of one set-aside starts in the same beat, runs the same 400ms and
 * ends in a row that reads left to right, so two of them cross exactly when the
 * places they leave from are not in that same order. Not crossing is therefore
 * the whole of the fix, and it is a question about order and nothing else — see
 * `setAside.ts` for why no stagger and no arc can answer it instead.
 */
describe("the order the row is filled in", () => {
  test("three dice across: the tap order gives way to the table's", () => {
    // Reaching for the third die and then the first.
    const hand = [inHand(1, 0), inHand(3, 1), inHand(5, 2)];
    expect(inTableOrder([2, 0], cellsOf(hand))).toEqual([0, 2]);
  });

  test("a hand of six is two rows, so the fourth die is not the fourth along", () => {
    // 1, 2, 5, 3, 1, 1 with the 1s and the 5 set aside. The fourth cell sits
    // under the first, so the die in the fifth is left of the one in the third
    // — which the Roll's own numbering says the opposite of.
    const hand = [
      inHand(1, 0),
      inHand(2, 1),
      inHand(5, 2),
      inHand(3, 3),
      inHand(1, 4),
      inHand(1, 5),
    ];
    expect(inTableOrder([5, 2, 0, 4], cellsOf(hand))).toEqual([0, 4, 2, 5]);
  });

  test("one column, two rows: the upper die goes first", () => {
    const hand = [inHand(1, 0), inHand(2, 1), inHand(5, 2), inHand(1, 3)];
    expect(inTableOrder([3, 0], cellsOf(hand))).toEqual([0, 3]);
  });

  test("a hand nobody measured is left in the order it came in", () => {
    // A phone that opened the Game after the Roll had gone. There is no flight
    // to protect either, so there is nothing to decide.
    expect(inTableOrder([2, 0], [null, null, null])).toEqual([2, 0]);
  });
});

describe("dice on their way to the row never cross", () => {
  /** Where a die takes off from: its berth, offset back by its flight. */
  const takesOffAt = (flights: { x: number }[], places: number[]) =>
    flights.map((flight, index) => flight.x + berth(places[index])!.left);

  test("a repeated face: the die comes from the place past the one before it", () => {
    // A Roll of 1, 5, 1 with the last two set aside. The 5 has to come out of
    // the middle cell, so the 1 beside it has to come out of the right-hand
    // one — the left-hand 1 is a die the Player never picked up, and flying
    // from there would cross the 5 on the way.
    const hand = [inHand(1, 0), inHand(5, 1), inHand(1, 2)];
    const flights = takeoffs([5, 1], hand, [berth(0), berth(1)]);
    expect(flights).toEqual([
      offset(hand[1], berth(0)!),
      offset(hand[2], berth(1)!),
    ]);
    const [first, second] = takesOffAt(flights, [0, 1]);
    expect(first).toBeLessThan(second);
  });

  test("a Drilling out of a scattered hand leaves left to right", () => {
    // 1, 2, 1, 3, 1: three 1s set aside out of five dice, which is two rows.
    const hand = [
      inHand(1, 0),
      inHand(2, 1),
      inHand(1, 2),
      inHand(3, 3),
      inHand(1, 4),
    ];
    // The row was filled the same way, so the leftmost 1 of the three is the
    // one in the second row.
    const flights = takeoffs([1, 1, 1], hand, [berth(0), berth(1), berth(2)]);
    expect(flights).toEqual([
      offset(hand[0], berth(0)!),
      offset(hand[4], berth(1)!),
      offset(hand[2], berth(2)!),
    ]);
    const places = takesOffAt(flights, [0, 1, 2]);
    expect(places[0]).toBeLessThan(places[1]);
    expect(places[1]).toBeLessThan(places[2]);
  });

  test("a TUTTO's six dice each leave from the cell the row took them from", () => {
    // Every die of the hand set aside at once, out of two rows. Two dice of one
    // column take off from the same place along the table and are clear of each
    // other anyway, being one above the other — so this pins the cells rather
    // than only the order.
    const hand = [
      inHand(1, 0),
      inHand(2, 1),
      inHand(5, 2),
      inHand(3, 3),
      inHand(1, 4),
      inHand(1, 5),
    ];
    const order = inTableOrder([0, 1, 2, 3, 4, 5], cellsOf(hand));
    expect(order).toEqual([0, 3, 1, 4, 2, 5]);
    const flights = takeoffs(
      order.map((cell) => hand[cell].face),
      hand,
      order.map((_, place) => berth(place)),
    );
    expect(flights).toEqual(
      order.map((cell, place) => offset(hand[cell], berth(place)!)),
    );
  });

  test("a hand that cannot be read left to right leaves the die simply there", () => {
    // Only reachable from a row that was not filled in the table's order, which
    // is no longer how the row is filled. A die with nowhere left to come from
    // appears in its berth rather than flying across its neighbour.
    const hand = [inHand(1, 0), inHand(5, 1)];
    expect(takeoffs([5, 1], hand, [berth(0), berth(1)])).toEqual([
      offset(hand[1], berth(0)!),
      { x: 0, y: 0 },
    ]);
  });
});
