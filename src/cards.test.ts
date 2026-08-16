import { describe, expect, test } from "vitest";
import { CARDS } from "./game/turn";
import { cardFace, MARK_LINE, type CardFamily } from "./cards";

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
      expect(cardFace(card).mark.join("")).not.toBe("");
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
  // grew as long as »PLUS/MINUS« would be a smudge rather than an index. One
  // rule, applied without judgement: the mark's opening, cut to four.
  test("every corner index is the start of the mark, cut to four", () => {
    for (const card of CARDS) {
      const { corner, mark } = cardFace(card);
      expect(corner).not.toBe("");
      expect(corner.length).toBeLessThanOrEqual(4);
      expect(mark[0].startsWith(corner)).toBe(true);
    }
  });

  test("the long Forcing names are cut, the short ones are whole", () => {
    expect(cardFace("stop").corner).toBe("STOP");
    expect(cardFace("cloverleaf").corner).toBe("KLEE");
    // Not »±«: a corner index abbreviates the mark, it does not translate it.
    expect(cardFace("plusMinus").corner).toBe("PLUS");
  });
});

describe("the mark fits the card it is printed on", () => {
  // The mark is set as large as its longest line will go across the card, so a
  // line longer than this is a mark set smaller than the effect sentence under
  // it — which is what »FEUERWERK« on one line was.
  test("no line of any mark is longer than the card can set legibly", () => {
    for (const card of CARDS) {
      for (const line of cardFace(card).mark) {
        expect(line.length).toBeLessThanOrEqual(MARK_LINE);
      }
    }
  });

  test("a name too long for one line is broken, not shrunk", () => {
    expect(cardFace("fireworks").mark).toEqual(["FEUER", "WERK"]);
    expect(cardFace("cloverleaf").mark).toEqual(["KLEE", "BLATT"]);
  });

  test("a name that fits stays on one line", () => {
    expect(cardFace("stop").mark).toEqual(["STOP"]);
    expect(cardFace("bonus600").mark).toEqual(["600"]);
  });
});
