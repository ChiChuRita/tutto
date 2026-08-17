import { describe, expect, test } from "vitest";
import { flightStart, type Rect } from "./flight";

/**
 * The draw is measured, not guessed: the Card starts on the pile wherever the
 * pile happens to be. These are the layouts the app actually produces — the
 * pile and the slot side by side in the stat row, that row pushed down the page
 * by the »letzte Runde« banner above it, and the first frame, where nothing has
 * been measured yet.
 */

/** A card, at the size both the pile and the slot are drawn: 65.3 × 96. */
const card = (left: number, top: number, width = 65.3, height = 96): Rect => ({
  left,
  top,
  width,
  height,
});

/** The stat row at 390px: the pile, a 12px gap, then the slot. */
const PILE = card(243.4, 52);
const SLOT = card(320.7, 52);
const GAP = 12;

describe("where the flight starts", () => {
  test("the pile beside the slot: a short sideways hop", () => {
    const start = flightStart(PILE, SLOT);
    // One card and one gap to the left, and no fall down the page at all.
    expect(start.x).toBeCloseTo(-(65.3 + GAP));
    expect(start.y).toBe(0);
  });

  test("what moves the row moves both, so the hop is the same", () => {
    // The banner and the scoreboard sit above the row and shift the whole of
    // it. The flight is measured rather than written down, so it follows.
    const banner = 64;
    const moved = flightStart(
      card(243.4, 52 + banner),
      card(320.7, 52 + banner),
    );
    expect(moved).toEqual(flightStart(PILE, SLOT));
  });

  test("a slot somewhere else entirely: the Card still comes off the pile", () => {
    // Nothing about the row is written into the geometry, so a slot below the
    // pile flies down to it rather than sideways.
    const start = flightStart(PILE, card(162.4, 316));
    expect(start.y).toBe(-264);
    expect(start.x).toBeCloseTo(81);
  });

  test("nothing measured yet: the Card is simply there", () => {
    expect(flightStart(null, SLOT)).toEqual({ x: 0, y: 0 });
    expect(flightStart(PILE, null)).toEqual({ x: 0, y: 0 });
    // An element that exists but has not been laid out measures all zeroes.
    // Its centre is the top-left of the page, which would fling the Card off
    // the screen — so an unsized rectangle counts as unmeasured too.
    expect(flightStart(card(0, 0, 0, 0), SLOT)).toEqual({ x: 0, y: 0 });
    expect(flightStart(PILE, card(0, 0, 0, 0))).toEqual({ x: 0, y: 0 });
  });
});
