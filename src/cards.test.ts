import { describe, expect, test } from "vitest";
import { CARDS } from "./game/turn";
import { cardFace, type CardFamily } from "./cards";

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
});
