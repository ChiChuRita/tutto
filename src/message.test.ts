import { describe, expect, it } from "vitest";
import {
  applyEvent,
  newGame,
  type Card,
  type Face,
  type GameState,
} from "./game/turn";
import { turnMessage } from "./message";

/**
 * The message line is one line of fixed height, so the only thing worth
 * asserting is that a Turn is never owed two sentences at once. Every Turn
 * below is played through the reducer rather than written down as a literal:
 * the bug this guards against was believing a combination was unreachable, and
 * a hand-built Turn would only restate the belief.
 */

const roll = (...faces: Face[]) => ({ type: "roll" as const, faces });
const setAside = (...dice: number[]) => ({ type: "setAside" as const, dice });
const draw = (card: Card) => ({ type: "draw" as const, card });

const play = (
  state: GameState,
  ...events: Parameters<typeof applyEvent>[1][]
) => events.reduce(applyEvent, state);

/** Two Seats, so Plus/Minus has a leader to take its 1000 off. */
const inPlay = () =>
  play(
    newGame(),
    { type: "takeSeat", name: "Anna", owner: null },
    { type: "takeSeat", name: "Bert", owner: null },
    { type: "start" },
  );

/** Six 1s set aside in one Roll: a Tutto. */
const aTutto = [roll(1, 1, 1, 1, 1, 1), setAside(0, 1, 2, 3, 4, 5)];

const on = (card: Card, ...events: Parameters<typeof applyEvent>[1][]) =>
  play(applyEvent(inPlay(), draw(card)), ...events);

describe("the play screen's message line", () => {
  it("says nothing while the Turn is simply being played", () => {
    expect(turnMessage(inPlay().turn)).toBeNull();
    expect(turnMessage(on("bonus200", roll(1, 2, 3, 3, 4, 6)).turn)).toBeNull();
  });

  it("announces a Tutto that hands the six dice back", () => {
    const game = on("bonus200", ...aTutto);

    expect(game.turn.tutto).toBe(true);
    expect(game.turn.diceInHand).toBe(6);
    expect(turnMessage(game.turn)).toBe("TUTTO! Alle sechs Würfel zurück.");
  });

  it("announces a Niete, and the Feuerwerk that pays out on one", () => {
    expect(turnMessage(on("bonus200", roll(2, 2, 3, 3, 4, 6)).turn)).toBe(
      "Niete! Alle Punkte aus diesem Zug sind weg.",
    );
    expect(
      turnMessage(on("fireworks", ...aTutto, roll(2, 2, 3, 3, 4, 6)).turn),
    ).toBe("Niete! Feuerwerk vorbei, 2000 Punkte gesichert.");
  });

  it("announces a Stop-Karte", () => {
    expect(turnMessage(on("stop").turn)).toBe(
      "Stop-Karte! Der Zug ist vorbei, keine Punkte.",
    );
  });

  it("announces a Turn the Player stopped", () => {
    const game = on("bonus200", roll(1, 2, 3, 3, 4, 6), setAside(0), {
      type: "stop",
    });

    expect(turnMessage(game.turn)).toBe("Zug beendet. 100 Punkte gesichert.");
  });

  /**
   * The one case where a Tutto and a finished Turn are both true: Plus/Minus
   * banks its flat 1000 on the Tutto and ends the Turn in the same move. Two
   * sentences here would run together and outgrow the line they sit in.
   */
  it("says one thing, not two, when a Plus/Minus ends the Turn on a Tutto", () => {
    const game = on("plusMinus", ...aTutto);

    expect(game.turn.tutto).toBe(true);
    expect(game.turn.phase).toBe("stopped");
    expect(turnMessage(game.turn)).toBe(
      "TUTTO! Zug beendet, 1000 Punkte gesichert.",
    );
  });
});
