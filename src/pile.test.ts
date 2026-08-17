import { describe, expect, test } from "vitest";
import { buriedCards } from "./pile";

/**
 * The played pile is as deep as the deck is short: every Card that has come off
 * the deck is lying on it. The Card in force is the top of the pile, so what is
 * left to draw underneath it is one fewer.
 */
describe("how deep the played pile is", () => {
  test("the Card in force lies on Cards played before it", () => {
    // Three Cards drawn out of 56, the third of them face-up on top.
    expect(buriedCards(53, true)).toBe(2);
  });

  test("a deep pile draws no deeper than a full one", () => {
    // Four Cards played and forty are the same picture: a pile. Drawing the
    // difference would cost fifty elements and buy nothing, which is the call
    // the deck's own stack already makes.
    expect(buriedCards(52, true)).toBe(buriedCards(16, true));
  });

  test("with no Card in force the whole pile is edges", () => {
    // A Turn waiting on its first draw, and a TUTTO that has just spent its
    // Card: nothing is face-up, so the Card that was on top is an edge like
    // the rest. The pile is the Game's and does not empty between Turns.
    expect(buriedCards(54, false)).toBe(2);
  });

  test("nothing played yet: an empty place for a Card", () => {
    expect(buriedCards(56, false)).toBe(0);
  });

  test("the reshuffle puts the pile back in the deck under the Card on it", () => {
    // Drawing the 56th Card puts all 56 back, so a full deck and a Card in
    // force are true at the same moment. The pile has just been picked up and
    // this Card is the first thing on the new one — there is nothing under it.
    expect(buriedCards(56, true)).toBe(0);
  });
});
