import { describe, expect, test } from "vitest";
import { flightStart, type Rect } from "./draw";

/**
 * The draw is measured, not guessed: the Card starts on the pile wherever the
 * pile happens to be. These are the layouts the app actually produces — the
 * pile up in the stat row above the slot, the »letzte Runde« banner pushing the
 * slot further down, and the first frame, where nothing has been measured yet.
 */

const rect = (left: number, top: number, width = 76, height = 112): Rect => ({
  left,
  top,
  width,
  height,
});

describe("where the flight starts", () => {
  test("the pile above the slot: the Card starts up there", () => {
    // The pile sits in the stat row, the slot a few blocks below it.
    const start = flightStart(rect(150, 40), rect(150, 376));
    expect(start.x).toBe(0);
    expect(start.y).toBe(-336);
  });

  test("the pile beside the slot: the Card starts over there", () => {
    // The real layout: the pile shares the stat row with »Im Zug«, so it sits
    // up *and* to the right of the slot, which is centred in the column.
    const start = flightStart(rect(242, 40), rect(150, 376));
    expect(start.x).toBe(92);
    expect(start.y).toBe(-336);
  });

  test("the »letzte Runde« banner pushes the slot down, and the start follows", () => {
    // The banner sits between the pile and the slot, so it moves the slot and
    // leaves the pile where it was. A fixed offset gets exactly this wrong.
    const pile = rect(242, 40);
    const banner = 76;
    const without = flightStart(pile, rect(150, 376));
    const with_ = flightStart(pile, rect(150, 376 + banner));
    expect(with_.y).toBe(without.y - banner);
    expect(with_.x).toBe(without.x);
  });

  test("nothing measured yet: the Card is simply there", () => {
    const slot = rect(150, 376);
    expect(flightStart(null, slot)).toEqual({ x: 0, y: 0 });
    expect(flightStart(rect(242, 40), null)).toEqual({ x: 0, y: 0 });
    // An element that exists but has not been laid out measures all zeroes.
    // Its centre is the top-left of the page, which would fling the Card off
    // the screen — so an unsized rectangle counts as unmeasured too.
    expect(flightStart(rect(0, 0, 0, 0), slot)).toEqual({ x: 0, y: 0 });
    expect(flightStart(rect(242, 40), rect(0, 0, 0, 0))).toEqual({
      x: 0,
      y: 0,
    });
  });
});
