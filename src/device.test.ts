import { describe, expect, test } from "vitest";
import {
  gameIdIn,
  gameUrl,
  knownGames,
  remember,
  rememberSeat,
  seatSecretIn,
} from "./device";

describe("the URL of a Game", () => {
  test("carries the Game's id", () => {
    expect(gameUrl("k17abc")).toBe("?game=k17abc");
  });

  test("is read back from the address the browser is on", () => {
    expect(gameIdIn("https://tutto.example/?game=k17abc")).toBe("k17abc");
  });

  test("is absent on the start screen", () => {
    expect(gameIdIn("https://tutto.example/")).toBe(null);
  });
});

describe("the Games this device has opened", () => {
  test("start out as none", () => {
    expect(knownGames(null)).toEqual([]);
  });

  test("survive being written down and read back", () => {
    expect(knownGames(remember(null, "k17abc"))).toEqual(["k17abc"]);
  });

  test("keep every Game, not just the most recent one", () => {
    const stored = remember(remember(null, "k17abc"), "k17def");
    expect(knownGames(stored)).toEqual(["k17abc", "k17def"]);
  });

  test("list a reopened Game once", () => {
    const stored = remember(remember(null, "k17abc"), "k17abc");
    expect(knownGames(stored)).toEqual(["k17abc"]);
  });

  test("are none when what was stored is not a list of Games", () => {
    // The single game id this key used to hold, and anything else corrupt.
    expect(knownGames("k17abc")).toEqual([]);
    expect(knownGames('{"a":1}')).toEqual([]);
    expect(knownGames("[1,2]")).toEqual([]);
  });
});

describe("the Seats this device holds", () => {
  test("start out as none", () => {
    expect(seatSecretIn(null, "k17abc")).toBe(null);
  });

  test("prove a Seat after being written down and read back", () => {
    const stored = rememberSeat(null, "k17abc", "s-1");

    expect(seatSecretIn(stored, "k17abc")).toBe("s-1");
  });

  test("are held for several Games at once", () => {
    const stored = rememberSeat(
      rememberSeat(null, "k17abc", "s-1"),
      "k17def",
      "s-2",
    );

    expect(seatSecretIn(stored, "k17abc")).toBe("s-1");
    expect(seatSecretIn(stored, "k17def")).toBe("s-2");
  });

  test("prove nothing about a Game this device has no Seat in", () => {
    expect(seatSecretIn(rememberSeat(null, "k17abc", "s-1"), "k17def")).toBe(
      null,
    );
  });

  test("are none when what was stored is not a Seat per Game", () => {
    expect(seatSecretIn("s-1", "k17abc")).toBe(null);
    expect(seatSecretIn('["k17abc"]', "k17abc")).toBe(null);
    expect(seatSecretIn('{"k17abc":1}', "k17abc")).toBe(null);
  });
});
