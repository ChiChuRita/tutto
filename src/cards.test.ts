import { describe, expect, test } from "vitest";
import { CARDS } from "./game/turn";
import { cardFace, markLongestWord, type CardFamily } from "./cards";

const FAMILIES: CardFamily[] = ["bonus", "multiplier", "forcing"];

/**
 * The face is looked up by Card, so an unstyled Card is a compile error rather
 * than something you find on screen. These hold the mapping to the design: all
 * eleven Cards have a family and a mark, and the Forcing family is exactly the
 * five Cards the glossary names.
 */
describe("every Card has a face", () => {
  test("all eleven Cards map to a family and a mark", () => {
    expect(CARDS).toHaveLength(11);
    for (const card of CARDS) {
      expect(FAMILIES).toContain(cardFace(card).family);
      expect(cardFace(card).mark).not.toBe("");
    }
  });

  test("the Forcing family is the five Cards that take Stop away", () => {
    const forcing = CARDS.filter((card) => cardFace(card).family === "forcing");
    expect(forcing).toEqual([
      "stop",
      "fireworks",
      "straight",
      "plusMinus",
      "cloverleaf",
    ]);
  });

  test("only a Bonus needs a word above its number", () => {
    for (const card of CARDS) {
      const { family, lede } = cardFace(card);
      expect(lede === null).toBe(family !== "bonus");
    }
  });

  // The corners are printed at a fraction of the mark's size, so a corner that
  // grew as long as »PLUS/MINUS« would be a smudge rather than an index.
  test("every corner index is short enough to read small", () => {
    for (const card of CARDS) {
      const { corner } = cardFace(card);
      expect(corner).not.toBe("");
      expect(corner.length).toBeLessThanOrEqual(4);
    }
  });
});

describe("the mark is sized by its longest word", () => {
  test("a word that cannot break counts whole", () => {
    expect(markLongestWord("FEUERWERK")).toBe(9);
  });

  test("a mark the browser may break counts only its longest piece", () => {
    expect(markLongestWord("PLUS/MINUS")).toBe(5);
  });

  // Nine is what a 2:3 card this tall holds on one line. A longer word would
  // still render, just smaller than the design was drawn for.
  test("no Card needs a line longer than the card can hold", () => {
    for (const card of CARDS) {
      expect(markLongestWord(cardFace(card).mark)).toBeLessThanOrEqual(9);
    }
  });
});
