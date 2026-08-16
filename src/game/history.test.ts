import { describe, expect, it } from "vitest";
import { applyEvent, newGame, type Face, type GameState } from "./turn";
import { turnEnding, turnStep, type RecordedTurn } from "./history";

/**
 * A recorded Turn is a replay: these tests play a Turn through the reducer and
 * read the record back, asking whether it says what happened.
 */

const roll = (...faces: Face[]) => ({ type: "roll" as const, faces });
const setAside = (...dice: number[]) => ({ type: "setAside" as const, dice });

/** A Game past its lobby, with as many Seats as asked for, ready to play. */
const inPlay = (seatCount = 1): GameState =>
  applyEvent(
    Array.from({ length: seatCount }, (_, index) => ({
      type: "takeSeat" as const,
      name: `Spieler ${index + 1}`,
      owner: null,
    })).reduce(applyEvent, newGame()),
    { type: "start" },
  );

/** Plays the events and collects the record the way `convex/games.ts` does. */
const record = (
  start: GameState,
  ...events: Parameters<typeof applyEvent>[1][]
): RecordedTurn => {
  let state = start;
  const steps: RecordedTurn["steps"] = [];
  let ending: RecordedTurn["ending"] = null;
  for (const event of events) {
    const after = applyEvent(state, event);
    const step = turnStep(state, event, after);
    if (step !== null) steps.push(step);
    ending = ending ?? turnEnding(after.turn);
    state = after;
  }
  return { steps, ending };
};

describe("a recorded Turn", () => {
  it("holds the Card, the Roll's faces, what was set aside, and the ending", () => {
    const played = record(
      inPlay(),
      { type: "draw", card: "bonus200" },
      roll(1, 5, 2, 3, 4, 6),
      setAside(0, 1),
      { type: "stop" },
    );

    expect(played).toEqual({
      steps: [
        { type: "draw", card: "bonus200" },
        { type: "roll", faces: [1, 5, 2, 3, 4, 6] },
        { type: "setAside", faces: [1, 5], tutto: false },
      ],
      ending: "stopped",
    });
  });

  it("marks the set-aside that completed a Tutto", () => {
    const played = record(
      inPlay(),
      { type: "draw", card: "bonus200" },
      roll(1, 1, 1, 1, 1, 1),
      setAside(0, 1, 2, 3, 4, 5),
    );

    expect(played.steps[played.steps.length - 1]).toEqual({
      type: "setAside",
      faces: [1, 1, 1, 1, 1, 1],
      tutto: true,
    });
  });

  it("ends on the Niete that killed it", () => {
    const played = record(
      inPlay(),
      { type: "draw", card: "bonus200" },
      roll(2, 2, 3, 3, 4, 6),
    );

    expect(played.ending).toBe("null");
  });

  it("ends on a Feuerwerk's Niete, which is how a Feuerwerk always ends", () => {
    const played = record(
      inPlay(),
      { type: "draw", card: "fireworks" },
      roll(1, 1, 1, 1, 1, 1),
      setAside(0, 1, 2, 3, 4, 5),
      roll(2, 2, 3, 3, 4, 6),
    );

    expect(played.ending).toBe("null");
  });

  it("ends on the Stop-Karte that took the Turn away", () => {
    const played = record(inPlay(), { type: "draw", card: "stop" });

    expect(played).toEqual({
      steps: [{ type: "draw", card: "stop" }],
      ending: "stopCard",
    });
  });

  it("ends on the Kleeblatt's second TUTTO as a win", () => {
    const played = record(
      inPlay(),
      { type: "draw", card: "cloverleaf" },
      roll(1, 1, 1, 1, 1, 1),
      setAside(0, 1, 2, 3, 4, 5),
      roll(1, 1, 1, 1, 1, 1),
      setAside(0, 1, 2, 3, 4, 5),
    );

    expect(
      played.steps.filter((step) => "tutto" in step && step.tutto),
    ).toEqual([
      { type: "setAside", faces: [1, 1, 1, 1, 1, 1], tutto: true },
      { type: "setAside", faces: [1, 1, 1, 1, 1, 1], tutto: true },
    ]);
    expect(played.ending).toBe("won");
  });

  it("ends a Plus/Minus on its TUTTO, which stops the Turn there", () => {
    const played = record(
      inPlay(2),
      { type: "draw", card: "plusMinus" },
      roll(1, 1, 1, 1, 1, 1),
      setAside(0, 1, 2, 3, 4, 5),
    );

    expect(played.ending).toBe("stopped");
  });

  it("says nothing about a Turn still being played", () => {
    const played = record(
      inPlay(),
      { type: "draw", card: "bonus200" },
      roll(1, 5, 2, 3, 4, 6),
    );

    expect(played.ending).toBe(null);
  });
});
