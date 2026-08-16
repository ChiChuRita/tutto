import { describe, expect, it } from "vitest";
import { statsFor, type StatsGame } from "./stats";

/**
 * Head-to-head is a derivation, so these tests are the derivation's whole
 * story: build the finished Games, ask what they say about one User, and check
 * the answer against the rulebook — no database, no mocking.
 */

const ANNA = "user_anna";
const BEN = "user_ben";
const CARLA = "user_carla";

/** A finished Game, given who sat where and which Seats won. */
const finished = (
  owners: (string | null)[],
  winners: number[],
  turns: { seatIndex: number; score: number }[] = [],
): StatsGame => ({
  seats: owners.map((owner) => ({ owner })),
  phase: "over",
  abandoned: false,
  winners,
  turns,
});

describe("head-to-head", () => {
  it("counts a Game shared with an opponent as a win for one and a loss for the other", () => {
    const games = [finished([ANNA, BEN], [0])];

    expect(statsFor(ANNA, games).opponents).toEqual([
      { opponent: BEN, games: 1, wins: 1, losses: 0 },
    ]);
    expect(statsFor(BEN, games).opponents).toEqual([
      { opponent: ANNA, games: 1, wins: 0, losses: 1 },
    ]);
  });

  it("adds up several Games against the same opponent", () => {
    const stats = statsFor(ANNA, [
      finished([ANNA, BEN], [0]),
      finished([BEN, ANNA], [0]),
      finished([ANNA, BEN], [1]),
    ]);

    expect(stats.opponents).toEqual([
      { opponent: BEN, games: 3, wins: 1, losses: 2 },
    ]);
  });

  it("counts a Game won by two Seats as neither a win nor a loss", () => {
    const games = [finished([ANNA, BEN], [0, 1])];

    expect(statsFor(ANNA, games).opponents).toEqual([
      { opponent: BEN, games: 1, wins: 0, losses: 0 },
    ]);
    expect(statsFor(BEN, games).opponents).toEqual([
      { opponent: ANNA, games: 1, wins: 0, losses: 0 },
    ]);
  });

  it("leaves an abandoned Game out of the numbers entirely", () => {
    const abandoned: StatsGame = {
      ...finished([ANNA, BEN], []),
      abandoned: true,
    };

    expect(statsFor(ANNA, [abandoned])).toEqual({
      bestTurn: null,
      opponents: [],
    });
  });

  it("leaves a Game that is still being played out of the numbers", () => {
    const running: StatsGame = {
      ...finished([ANNA, BEN], []),
      phase: "playing",
    };

    expect(statsFor(ANNA, [running]).opponents).toEqual([]);
  });

  it("skips guest Seats, so a Game against guests shows no opponent", () => {
    const stats = statsFor(ANNA, [finished([ANNA, null, null], [1])]);

    expect(stats.opponents).toEqual([]);
  });

  it("records a three-Seat Game against each opponent separately", () => {
    const stats = statsFor(ANNA, [finished([ANNA, BEN, CARLA], [1])]);

    expect(stats.opponents).toEqual([
      { opponent: BEN, games: 1, wins: 0, losses: 1 },
      { opponent: CARLA, games: 1, wins: 0, losses: 0 },
    ]);
  });

  it("counts the winner's Game as a win against every Seat that lost it", () => {
    const stats = statsFor(ANNA, [finished([ANNA, BEN, CARLA], [0])]);

    expect(stats.opponents).toEqual([
      { opponent: BEN, games: 1, wins: 1, losses: 0 },
      { opponent: CARLA, games: 1, wins: 1, losses: 0 },
    ]);
  });

  it("shows the opponent played most often first", () => {
    const stats = statsFor(ANNA, [
      finished([ANNA, CARLA], [0]),
      finished([ANNA, BEN], [0]),
      finished([ANNA, BEN], [1]),
    ]);

    expect(stats.opponents.map((record) => record.opponent)).toEqual([
      BEN,
      CARLA,
    ]);
  });

  it("says nothing about a User who has played nobody", () => {
    expect(statsFor(ANNA, [])).toEqual({ bestTurn: null, opponents: [] });
  });

  it("says nothing about a User who was not in any of these Games", () => {
    expect(statsFor(ANNA, [finished([BEN, CARLA], [0])])).toEqual({
      bestTurn: null,
      opponents: [],
    });
  });
});

describe("the best single Turn", () => {
  it("is the highest one across every Game", () => {
    const stats = statsFor(ANNA, [
      finished([ANNA, BEN], [0], [{ seatIndex: 0, score: 1500 }]),
      finished([BEN, ANNA], [1], [{ seatIndex: 1, score: 2600 }]),
      finished([ANNA, BEN], [0], [{ seatIndex: 0, score: 900 }]),
    ]);

    expect(stats.bestTurn).toBe(2600);
  });

  it("is this User's own Turn, never an opponent's", () => {
    const stats = statsFor(ANNA, [
      finished(
        [ANNA, BEN],
        [1],
        [
          { seatIndex: 0, score: 800 },
          { seatIndex: 1, score: 4000 },
        ],
      ),
    ]);

    expect(stats.bestTurn).toBe(800);
  });

  it("comes from a solo Game too, which has no opponent to show", () => {
    const stats = statsFor(ANNA, [
      finished([ANNA], [0], [{ seatIndex: 0, score: 3000 }]),
    ]);

    expect(stats).toEqual({ bestTurn: 3000, opponents: [] });
  });

  it("is nothing when the only Turns are in an abandoned Game", () => {
    const stats = statsFor(ANNA, [
      {
        ...finished([ANNA, BEN], [], [{ seatIndex: 0, score: 5000 }]),
        abandoned: true,
      },
    ]);

    expect(stats.bestTurn).toBe(null);
  });
});
