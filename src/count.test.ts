import { describe, expect, test } from "vitest";
import { countAt, countMs, COUNT_MS } from "./count";

describe("a number counting to a new value", () => {
  test("starts on the number it is leaving", () => {
    expect(countAt(4200, 5350, 0)).toBe(4200);
  });

  test("ends on the number itself, and stays there", () => {
    expect(countAt(4200, 5350, countMs(4200, 5350))).toBe(5350);
    expect(countAt(4200, 5350, COUNT_MS * 4)).toBe(5350);
  });

  test("is somewhere in the gap while it runs, which is the whole point", () => {
    const half = countAt(4200, 5350, countMs(4200, 5350) / 2);
    expect(half).toBeGreaterThan(4200);
    expect(half).toBeLessThan(5350);
  });

  test("passes through scores, not through every integer between them", () => {
    // Nothing in Tutto is worth less than a lone 5, so every score a Player has
    // ever had is a multiple of 50 — and a number running through 4237 is an
    // odometer rather than points being won.
    for (const value of through(0, 1150)) {
      expect(value % 50).toBe(0);
    }
  });

  test("takes as long as there is to count, and never longer than the cap", () => {
    // A lone 5 is one step and is over before the thumb has lifted; a Tutto's
    // worth of points is the long one. Both are the same flourish between taps,
    // so neither may outlast the cap — a Straße doubled is 4000 points, and
    // counting those one at a time would be a wait.
    expect(countMs(0, 50)).toBeLessThan(countMs(0, 300));
    expect(countMs(0, 300)).toBeLessThan(countMs(0, 1000));
    expect(countMs(0, 4000)).toBe(COUNT_MS);
    expect(countMs(4200, 4200)).toBe(0);
  });

  test("a loss drains: every step down, none of them past zero", () => {
    // The same mechanism the other way round, which is what a Niete emptying
    // the Turn's score is. A drain that dipped below its target or bounced back
    // up would be showing points that were never there.
    const drain = through(1150, 0);
    for (const [step, value] of drain.entries()) {
      expect(value).toBeLessThanOrEqual(drain[Math.max(0, step - 1)]);
      expect(value).toBeGreaterThanOrEqual(0);
    }
    expect(drain[drain.length - 1]).toBe(0);
  });
});

/** Every number a count shows, frame by frame at a generous 120Hz. */
const through = (from: number, to: number): number[] =>
  Array.from({ length: COUNT_MS / 8 + 2 }, (_, frame) =>
    countAt(from, to, frame * 8),
  );
