import { describe, expect, it } from "vitest";
import {
  applyEvent,
  newGame,
  validDice,
  type Face,
  type GameState,
} from "./turn";

/**
 * These tests speak the rulebook, not the implementation. They feed a state and
 * a sequence of events into the reducer and assert scores, dice, and how the
 * Turn ended — never how any of that is stored.
 */

const roll = (...faces: Face[]) => ({ type: "roll" as const, faces });
const setAside = (...dice: number[]) => ({ type: "setAside" as const, dice });

const play = (
  state: GameState,
  ...events: Parameters<typeof applyEvent>[1][]
) => events.reduce(applyEvent, state);

describe("a Roll", () => {
  it("shows the six faces that were thrown", () => {
    const game = applyEvent(newGame(), roll(1, 2, 3, 4, 5, 6));

    expect(game.turn.roll).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("marks 1s and 5s as valid and everything else as worthless", () => {
    expect(validDice([1, 2, 3, 4, 5, 6])).toEqual([
      true,
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it("marks the three dice of a triplet as valid", () => {
    expect(validDice([3, 3, 3, 2, 4, 6])).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it("marks nothing valid in a Roll with no 1, no 5 and no triplet", () => {
    expect(validDice([2, 2, 3, 3, 4, 6])).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe("the reducer", () => {
  it("never changes the state it was given", () => {
    const before = play(newGame(), roll(1, 1, 1, 2, 3, 4));
    const snapshot = structuredClone(before);

    applyEvent(before, setAside(0, 1, 2));

    expect(before).toEqual(snapshot);
  });

  it("keeps the banked score and the score at risk apart", () => {
    const game = play(newGame(), roll(1, 2, 3, 4, 6, 6), setAside(0));

    expect(game.seats[0].score).toBe(0);
    expect(game.turn.score).toBe(100);
  });
});

describe("the scoring table", () => {
  const scoreOf = (faces: Face[], ...dice: number[]) =>
    play(newGame(), roll(...faces), setAside(...dice)).turn.score;

  it("scores 100 for a single 1", () => {
    expect(scoreOf([1, 2, 3, 4, 6, 6], 0)).toBe(100);
  });

  it("scores 50 for a single 5", () => {
    expect(scoreOf([5, 2, 3, 4, 6, 6], 0)).toBe(50);
  });

  it("adds up several singles set aside together", () => {
    expect(scoreOf([1, 1, 5, 3, 4, 6], 0, 1, 2)).toBe(250);
  });

  it.each<[Face, number]>([
    [1, 1000],
    [2, 200],
    [3, 300],
    [4, 400],
    [5, 500],
    [6, 600],
  ])("scores a Drilling of %ds as %d", (face, expected) => {
    expect(scoreOf([face, face, face, 2, 3, 4], 0, 1, 2)).toBe(expected);
  });

  it("counts each die once: a 1 inside a Drilling of 1s is not also a single", () => {
    expect(scoreOf([1, 1, 1, 2, 3, 4], 0, 1, 2)).toBe(1000);
  });

  it("counts a fourth 1 as a single on top of the Drilling", () => {
    expect(scoreOf([1, 1, 1, 1, 3, 4], 0, 1, 2, 3)).toBe(1100);
  });

  it("scores six of one face in one Roll as two Drillinge", () => {
    expect(scoreOf([1, 1, 1, 1, 1, 1], 0, 1, 2, 3, 4, 5)).toBe(2000);
    expect(scoreOf([2, 2, 2, 2, 2, 2], 0, 1, 2, 3, 4, 5)).toBe(400);
  });

  it("refuses dice that score nothing", () => {
    const rolled = play(newGame(), roll(2, 2, 5, 3, 4, 6));

    expect(() => applyEvent(rolled, setAside(0, 1))).toThrow();
    expect(() => applyEvent(rolled, setAside(2, 0))).toThrow();
    expect(() => applyEvent(rolled, setAside())).toThrow();
  });

  it("refuses to set the same die aside twice", () => {
    const rolled = play(newGame(), roll(1, 2, 3, 4, 6, 6));

    expect(() => applyEvent(rolled, setAside(0, 0))).toThrow();
    expect(() => applyEvent(rolled, setAside(9))).toThrow();
  });
});

describe("rerolling", () => {
  it("throws only the dice that were not set aside", () => {
    const game = play(newGame(), roll(1, 1, 2, 3, 4, 6), setAside(0, 1));

    expect(game.turn.diceInHand).toBe(4);
    expect(() => applyEvent(game, roll(1, 1, 1, 1, 1, 1))).toThrow();
    expect(play(game, roll(5, 2, 3, 6)).turn.roll).toEqual([5, 2, 3, 6]);
  });

  it("scores nothing for a Drilling assembled across two Rolls", () => {
    // Two 2s stay in hand because a pair scores nothing; only the 1 goes aside.
    const first = play(newGame(), roll(2, 2, 1, 3, 4, 6), setAside(2));
    const second = applyEvent(first, roll(2, 5, 3, 4, 6));

    // The third 2 would complete a Drilling on the table, but not in one Roll.
    expect(() => applyEvent(second, setAside(0))).toThrow();
    expect(play(second, setAside(1)).turn.score).toBe(150);
  });
});

describe("the next Turn", () => {
  const stopped = () =>
    play(newGame(), roll(1, 2, 3, 4, 6, 6), setAside(0), { type: "stop" });

  it("starts with six dice in hand and nothing at risk", () => {
    const game = applyEvent(stopped(), { type: "nextTurn" });

    expect(game.turn.diceInHand).toBe(6);
    expect(game.turn.score).toBe(0);
    expect(game.turn.roll).toBeNull();
  });

  it("cannot be started while a Turn is still running", () => {
    expect(() => applyEvent(newGame(), { type: "nextTurn" })).toThrow();
  });
});

describe("a Tutto", () => {
  const tutto = () =>
    play(
      newGame(),
      roll(1, 1, 1, 2, 3, 4),
      setAside(0, 1, 2),
      roll(5, 2, 4),
      setAside(0),
      roll(1, 5),
      setAside(0, 1),
    );

  it("is announced when all six dice have been set aside", () => {
    expect(tutto().turn.tutto).toBe(true);
  });

  it("returns all six dice to the hand", () => {
    expect(tutto().turn.diceInHand).toBe(6);
  });

  it("keeps the Turn score, which keeps building afterwards", () => {
    const game = tutto();

    expect(game.turn.score).toBe(1200);
    expect(
      play(game, roll(1, 1, 1, 1, 1, 1), setAside(0, 1, 2)).turn.score,
    ).toBe(2200);
  });

  it("lets the Player stop and bank instead of rolling on", () => {
    expect(play(tutto(), { type: "stop" }).seats[0].score).toBe(1200);
  });

  it("stops being announced once the Player rolls on", () => {
    expect(play(tutto(), roll(1, 2, 3, 4, 5, 6)).turn.tutto).toBe(false);
  });
});

describe("stopping", () => {
  it("banks the Turn score", () => {
    const game = play(
      newGame(),
      roll(1, 1, 1, 2, 3, 4),
      setAside(0, 1, 2),
      roll(5, 2, 3),
      setAside(0),
      { type: "stop" },
    );

    expect(game.seats[0].score).toBe(1050);
    expect(game.turn.phase).toBe("stopped");
  });

  it("is refused before anything has been set aside", () => {
    expect(() => applyEvent(newGame(), { type: "stop" })).toThrow();
  });

  it("is refused while a Roll still awaits a decision", () => {
    const rolled = play(newGame(), roll(1, 1, 1, 2, 3, 4));

    expect(() => applyEvent(rolled, { type: "stop" })).toThrow();
  });
});

describe("a Null", () => {
  const nullRoll = () =>
    play(newGame(), roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2), roll(2, 3, 6));

  it("ends the Turn when a Roll holds no valid die", () => {
    expect(nullRoll().turn.phase).toBe("null");
  });

  it("forfeits every point of the Turn and banks nothing", () => {
    const game = nullRoll();

    expect(game.turn.score).toBe(0);
    expect(game.seats[0].score).toBe(0);
    expect(game.turn.setAside).toEqual([]);
  });

  it("shows the Roll that ended the Turn", () => {
    expect(nullRoll().turn.roll).toEqual([2, 3, 6]);
  });

  it("leaves the banked score of earlier Turns alone", () => {
    const banked = play(
      newGame(),
      roll(1, 2, 3, 4, 6, 6),
      setAside(0),
      { type: "stop" },
      { type: "nextTurn" },
    );
    const game = play(
      banked,
      roll(1, 1, 1, 2, 3, 4),
      setAside(0, 1, 2),
      roll(2, 3, 6),
    );

    expect(game.seats[0].score).toBe(100);
    expect(game.turn.score).toBe(0);
  });

  it("allows no further play in that Turn", () => {
    const game = nullRoll();

    expect(() => applyEvent(game, roll(1, 1, 1))).toThrow();
    expect(() => applyEvent(game, setAside(0))).toThrow();
    expect(() => applyEvent(game, { type: "stop" })).toThrow();
  });
});
