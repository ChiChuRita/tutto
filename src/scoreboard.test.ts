import { describe, expect, it } from "vitest";
import { applyEvent, newGame, type Face, type GameState } from "./game/turn";
import { leaderboard, scoreboardRow } from "./scoreboard";

/**
 * The collapsed row is the only scoreboard on screen, so the thing worth
 * asserting is that it always says both of its two things — whose Turn it is,
 * and where this device stands — for every kind of device that can be looking
 * at it, a Spectator's included.
 */

const table = (): GameState =>
  [
    { type: "takeSeat" as const, name: "Anna", owner: null },
    { type: "takeSeat" as const, name: "Bernd", owner: null },
    { type: "start" as const },
  ].reduce(applyEvent, newGame());

/** A started Game with these Seats, in the order they joined. */
const seated = (...names: string[]): GameState =>
  [
    ...names.map((name) => ({ type: "takeSeat" as const, name, owner: null })),
    { type: "start" as const },
  ].reduce(applyEvent, newGame());

/**
 * The Seat whose Turn it is takes one, banks what those dice are worth, and
 * play passes on. Scores only move by banking, so this is the only way to build
 * a table where the Seats stand in different places.
 */
const banks = (state: GameState, faces: Face[], dice: number[]): GameState =>
  [
    { type: "draw" as const, card: "bonus200" as const },
    { type: "roll" as const, faces },
    { type: "setAside" as const, dice },
    { type: "stop" as const },
    { type: "nextTurn" as const },
  ].reduce(applyEvent, state);

/** One round of four, leaving Dana 1100, Anna 1000, Cem 100 and Bernd 50. */
const round = (): GameState => {
  const start = seated("Anna", "Bernd", "Cem", "Dana");
  const anna = banks(start, [1, 1, 1, 5, 2, 3], [0, 1, 2]);
  const bernd = banks(anna, [5, 2, 2, 3, 3, 4], [0]);
  const cem = banks(bernd, [1, 2, 2, 3, 3, 4], [0]);
  return banks(cem, [1, 1, 1, 1, 2, 3], [0, 1, 2, 3]);
};

describe("the leaderboard", () => {
  it("shows the Seat above you, you, and the Seat below, ranked by score", () => {
    // Cem is third of four, so the window sits on him with a neighbour either
    // side — and in rank order, which is nothing like the order they joined in.
    expect(leaderboard(round(), 2).map((row) => row.name)).toEqual([
      "Anna",
      "Cem",
      "Bernd",
    ]);
  });

  it("gives the leader themselves and the two below, not an empty half-board", () => {
    expect(leaderboard(round(), 3).map((row) => row.name)).toEqual([
      "Dana",
      "Anna",
      "Cem",
    ]);
  });

  it("gives the Seat in last place the two above and themselves", () => {
    expect(leaderboard(round(), 1).map((row) => row.name)).toEqual([
      "Anna",
      "Cem",
      "Bernd",
    ]);
  });

  it("shows two Seats as two rows, with no phantom third", () => {
    const two = banks(seated("Anna", "Bernd"), [1, 1, 1, 5, 2, 3], [0, 1, 2]);
    expect(leaderboard(two, 1)).toEqual([
      { seat: 0, name: "Anna", score: 1000, you: false },
      { seat: 1, name: "Bernd", score: 0, you: true },
    ]);
  });

  it("shows one Seat as one row", () => {
    expect(leaderboard(seated("Anna"), 0).map((row) => row.name)).toEqual([
      "Anna",
    ]);
  });

  it("holds two Seats level on points in one order while something unrelated changes", () => {
    // Anna and Cem are both on 1000, Dana on 100, Bernd on 50.
    const anna = banks(
      seated("Anna", "Bernd", "Cem", "Dana"),
      [1, 1, 1, 5, 2, 3],
      [0, 1, 2],
    );
    const bernd = banks(anna, [5, 2, 2, 3, 3, 4], [0]);
    const cem = banks(bernd, [1, 1, 1, 5, 2, 3], [0, 1, 2]);
    const level = banks(cem, [1, 2, 2, 3, 3, 4], [0]);
    // Anna takes a Turn and throws a Niete. Neither Seat level on 1000 has
    // moved, so neither may change place: whose Turn it is and how many Turns
    // have been taken are nothing to do with rank.
    const after = [
      { type: "draw" as const, card: "bonus300" as const },
      { type: "roll" as const, faces: [2, 2, 3, 3, 4, 4] as Face[] },
      { type: "nextTurn" as const },
    ].reduce(applyEvent, level);
    const window = (state: GameState) =>
      leaderboard(state, 2).map((row) => row.name);
    // The tie is broken by the Seat, which is fixed for the life of the Game,
    // so Anna is above Cem before and after and for any other reason the
    // question is asked again.
    expect(window(level)).toEqual(["Anna", "Cem", "Dana"]);
    expect(window(after)).toEqual(window(level));
  });

  it("gives a Spectator, who holds no Seat and so has no neighbours, the top three", () => {
    expect(leaderboard(round(), null).map((row) => row.name)).toEqual([
      "Dana",
      "Anna",
      "Cem",
    ]);
  });
});

describe("the collapsed scoreboard row", () => {
  it("names the Seat whose Turn it is", () => {
    expect(scoreboardRow(table(), 1).turn).toBe("Anna ist am Zug.");
  });

  it("says so plainly when the Turn is yours", () => {
    expect(scoreboardRow(table(), 0).turn).toBe("Du bist am Zug.");
  });

  it("carries your own score", () => {
    const played = applyEvent(
      applyEvent(table(), { type: "draw", card: "bonus200" }),
      { type: "roll", faces: [1, 1, 1, 2, 3, 4] },
    );
    const scored = applyEvent(played, { type: "setAside", dice: [0, 1, 2] });
    // Banking is what moves a Seat's score; mid-Turn points are not yours yet.
    const banked = applyEvent(scored, { type: "stop" });
    const row = scoreboardRow(banked, 0);
    expect(row.standing).toBe("Du:");
    // A number and not a sentence with a number in it, because the row counts
    // it up rather than printing it.
    expect(row.score).toBe(1000);
  });

  it("gives a Spectator, who has no Seat and so no score, the row all the same", () => {
    const row = scoreboardRow(table(), null);
    expect(row.turn).toBe("Anna ist am Zug.");
    expect(row.standing).toBe("Du schaust zu.");
    expect(row.score).toBe(null);
  });

  it("says nothing yet on a screen that has only just opened", () => {
    // No settled position: the dice of a Roll already in the air are still
    // turning and the scores they are about to move must not be read off this
    // row first. The same three characters »Im Zug« stands on, so the row keeps
    // its fixed height while the screen fills in.
    const row = scoreboardRow(null, 0);
    expect(row.turn).toBe("…");
    expect(row.standing).toBe("…");
    // And no number for the row to count to either — there is nothing settled
    // to count from.
    expect(row.score).toBe(null);
  });
});
