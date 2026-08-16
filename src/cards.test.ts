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
  test("all eleven Cards map to a family", () => {
    expect(CARDS).toHaveLength(11);
    for (const card of CARDS) {
      expect(FAMILIES).toContain(cardFace(card).family);
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

  test("only ×2 goes without its German name", () => {
    for (const card of CARDS) {
      expect(cardFace(card).name === null).toBe(card === "x2");
    }
  });
});

/**
 * The face says what the Card *does*, not what it is called: the thousand given
 * over the thousand taken, a stop sign, a burst, the run, a clover. Only where
 * the number is itself the meaning does the face stay a numeral.
 */
describe("the face carries the Card's meaning", () => {
  test("every Card's mark is the thing it does", () => {
    expect(CARDS.map((card) => cardFace(card).mark.kind)).toEqual([
      "number",
      "number",
      "number",
      "number",
      "number",
      "stopSign",
      "burst",
      "run",
      "plusMinus",
      "number",
      "clover",
    ]);
  });

  test("the Bonus Cards and ×2 stay plain numerals", () => {
    expect(cardFace("bonus200").mark).toEqual({ kind: "number", text: "200" });
    expect(cardFace("bonus600").mark).toEqual({ kind: "number", text: "600" });
    expect(cardFace("x2").mark).toEqual({ kind: "number", text: "×2" });
  });

  // The face used to be the name set large, which is how »FEUERWERK« ended up
  // broken across two lines smaller than the sentence under the card. No mark
  // may be a word again.
  test("no face is a word", () => {
    for (const card of CARDS) {
      const { mark } = cardFace(card);
      if (mark.kind === "number") expect(mark.text).toMatch(/^(\d+|×2)$/);
    }
  });
});

describe("the corner index", () => {
  // The corners are printed at a fraction of the mark's size, so a corner that
  // grew as long as »PLUS/MINUS« would be a smudge rather than an index. One
  // rule, applied without judgement: the numeral, or the name cut to four.
  test("is the numeral, or the opening of the name", () => {
    for (const card of CARDS) {
      const { corner, mark, name } = cardFace(card);
      expect(corner).not.toBe("");
      expect(corner.length).toBeLessThanOrEqual(4);
      expect(corner).toBe(
        mark.kind === "number"
          ? mark.text
          : (name ?? "").toUpperCase().slice(0, 4),
      );
    }
  });

  test("the long names are cut, the short ones are whole", () => {
    expect(cardFace("stop").corner).toBe("STOP");
    expect(cardFace("cloverleaf").corner).toBe("KLEE");
    expect(cardFace("straight").corner).toBe("STRA");
    expect(cardFace("bonus400").corner).toBe("400");
    // Not »±«: a corner index abbreviates the name, it does not translate it
    // into some other alphabet.
    expect(cardFace("plusMinus").corner).toBe("PLUS");
  });
});
