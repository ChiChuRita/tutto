import { describe, expect, it } from "vitest";
import { applyEvent, newGame, type GameState } from "./game/turn";
import { scoreboardRow } from "./scoreboard";

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
