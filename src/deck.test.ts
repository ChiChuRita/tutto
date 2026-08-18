import { describe, expect, it } from "vitest";
import {
  applyEvent,
  canStop,
  CARDS,
  newGame,
  type Card,
  type Face,
  type GameState,
} from "./game/turn";
import { deckLabel, deckMove } from "./deck";

/**
 * The deck is the draw, so what it may be tapped for is a rule and not a
 * decoration. Every position below is played through the reducer rather than
 * written down as a literal: the thing worth guarding is which positions can
 * actually be reached, and a hand-built Turn would only restate the belief.
 */

const roll = (...faces: Face[]) => ({ type: "roll" as const, faces });
const setAside = (...dice: number[]) => ({ type: "setAside" as const, dice });
const draw = (card: Card) => ({ type: "draw" as const, card });

const play = (
  state: GameState,
  ...events: Parameters<typeof applyEvent>[1][]
) => events.reduce(applyEvent, state);

const seated = (names: string[]) =>
  play(
    newGame(),
    ...names.map((name) => ({
      type: "takeSeat" as const,
      name,
      owner: null,
    })),
    { type: "start" as const },
  );

/**
 * A solo Turn taken to its Tutto under one Card. A Straße's Tutto is 1 through
 * 6 and every other Card's is six 1s, because a Straße suspends the scoring
 * table outright and six 1s are not a Straße.
 */
const tutto = (card: Card) =>
  play(
    seated(["Anna"]),
    draw(card),
    card === "straight" ? roll(1, 2, 3, 4, 5, 6) : roll(1, 1, 1, 1, 1, 1),
    setAside(0, 1, 2, 3, 4, 5),
  );

/** No 1, no 5, no triplet: a Niete, and the Turn is over. */
const aNiete = roll(2, 2, 3, 3, 4, 6);

describe("what tapping the deck does", () => {
  it("draws the first Card of a Turn for the Seat whose Turn it is", () => {
    const game = seated(["Anna", "Bert"]);

    expect(deckMove(game, game, 0)).toEqual({
      action: "Karte ziehen",
      prompt: "Zieh oben eine Karte vom Stapel.",
      risky: false,
    });
  });

  it("offers nothing to a Seat waiting its Turn, or to a Spectator", () => {
    const game = seated(["Anna", "Bert"]);

    expect(deckMove(game, game, 1)).toBeNull();
    expect(deckMove(game, game, null)).toBeNull();
  });

  it("offers nothing once a Card is drawn and the dice are the move", () => {
    const rolling = play(seated(["Anna"]), draw("bonus200"));
    const picking = play(rolling, roll(1, 2, 3, 3, 4, 6));

    expect(rolling.turn.phase).toBe("awaitingRoll");
    expect(picking.turn.phase).toBe("awaitingSetAside");
    expect(deckMove(rolling, rolling, 0)).toBeNull();
    expect(deckMove(picking, picking, 0)).toBeNull();
  });

  it("hands the draw to the Seat up next on a Turn that is over", () => {
    const game = play(seated(["Anna", "Bert"]), draw("bonus200"), aNiete);

    expect(deckMove(game, game, 1)).toEqual({
      action: "Karte ziehen",
      prompt: "Zieh oben eine Karte vom Stapel.",
      risky: false,
    });
    expect(deckMove(game, game, 0)).toBeNull();
  });

  it("hands a solo Player the draw back on their own finished Turn", () => {
    const game = play(seated(["Anna"]), draw("bonus200"), aNiete);

    expect(deckMove(game, game, 0)).not.toBeNull();
  });

  it("says nothing while the dice the news is waiting for are still in the air", () => {
    const game = seated(["Anna"]);

    expect(deckMove(game, null, 0)).toBeNull();
  });

  it("reads the position the screen is showing, not the one it has not shown yet", () => {
    const said = seated(["Anna"]);
    const live = play(said, draw("bonus200"));

    // The Card is drawn and the table has not said so: the deck still offers
    // the draw the Player can see, and the server is what refuses a second one.
    expect(deckMove(live, said, 0)?.action).toBe("Karte ziehen");
  });
});

describe("the deck after a TUTTO", () => {
  it("rolls on, and names what tapping it puts back at risk", () => {
    const game = tutto("bonus200");

    expect(game.turn.phase).toBe("awaitingCard");
    expect(game.turn.tutto).toBe(true);
    expect(game.turn.score).toBe(2200);
    expect(deckMove(game, game, 0)).toEqual({
      action: "weitermachen — neue Karte ziehen und 2200 Punkte riskieren",
      prompt:
        "Weitermachen? Zieh oben eine Karte — und riskier die 2200 Punkte.",
      risky: true,
    });
  });

  it("is never the risky half of a choice that is not there", () => {
    // The other half is »aufhören«, and the prompt says so on every Card that
    // can reach this position — so every Card that can reach it must actually
    // leave stopping on offer. The three that take stopping away never do:
    // a Feuerwerk and a Kleeblatt stay in force and hand the dice back, and a
    // Plus/Minus ends the Turn on its Tutto. Played rather than argued, one
    // Card at a time, because the day a Card stops obeying that is the day the
    // screen starts promising a move the server would refuse.
    //
    // The Stop-Karte is left out because it never reaches a Tutto at all: it
    // ends the Turn in the same move it is drawn, before a die is thrown.
    for (const card of CARDS.filter((card) => card !== "stop")) {
      const game = tutto(card);

      if (game.turn.phase !== "awaitingCard" || !game.turn.tutto) continue;
      expect(canStop(game)).toBe(true);
      expect(deckMove(game, game, 0)?.risky).toBe(true);
    }
  });

  it("keeps a Feuerwerk and a Kleeblatt on the dice, where the Card left them", () => {
    // Both stay in force through their Tutto, so the move is a Roll and the
    // deck is not the one being reached for.
    const fireworks = tutto("fireworks");
    const cloverleaf = tutto("cloverleaf");

    expect(fireworks.turn.phase).toBe("awaitingRoll");
    expect(cloverleaf.turn.phase).toBe("awaitingRoll");
    expect(deckMove(fireworks, fireworks, 0)).toBeNull();
    expect(deckMove(cloverleaf, cloverleaf, 0)).toBeNull();
  });
});

describe("the deck's name", () => {
  it("keeps the count in it, whether or not there is a move", () => {
    // Only the `action` reaches the name, so any move at all will do here.
    const move = { action: "Karte ziehen", prompt: "", risky: false };

    expect(deckLabel(null, 56)).toBe("Kartenstapel, noch 56 Karten");
    expect(deckLabel(move, 56)).toBe("Karte ziehen, noch 56 Karten");
  });

  it("counts the last Card in the box in the singular", () => {
    expect(deckLabel(null, 1)).toBe("Kartenstapel, noch 1 Karte");
  });
});
