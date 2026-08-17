import { describe, expect, test } from "vitest";
import { takeoffs, type HandDie } from "./setAside";
import type { Rect } from "./flight";
import type { Face } from "./game/turn";

/**
 * The layout this really runs in: three dice across a 390px phone, each in the
 * box its cube sweeps through, and the »Herausgelegt« row a few hundred pixels
 * below them holding dice a third of the size.
 */
const DIE_BOX = 100.8;
const SMALL = 36;

/** The nth cell of the dice grid's first row. */
const inHand = (face: Face, column: number): HandDie => ({
  face,
  rect: {
    left: 22 + column * 122.6,
    top: 420,
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
