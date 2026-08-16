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
    expect(scoreboardRow(banked, 0).standing).toBe("Du: 1000");
  });

  it("gives a Spectator, who has no Seat and so no score, the row all the same", () => {
    const row = scoreboardRow(table(), null);
    expect(row.turn).toBe("Anna ist am Zug.");
    expect(row.standing).toBe("Du schaust zu.");
  });
});
