import { describe, expect, it } from "vitest";
import {
  applyEvent,
  cardsLeft,
  CARDS,
  newGame,
  validDice,
  type Card,
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
const draw = (card: Card) => ({ type: "draw" as const, card });

const play = (
  state: GameState,
  ...events: Parameters<typeof applyEvent>[1][]
) => events.reduce(applyEvent, state);

/**
 * A Turn always starts on a Card, so the dice tests start on a Bonus — the
 * Card that changes nothing until the Turn reaches a Tutto.
 */
const started = () => applyEvent(newGame(), draw("bonus200"));

/** Six 1s set aside in one Roll: a Tutto, worth 2000 before any Card. */
const aTutto = [roll(1, 1, 1, 1, 1, 1), setAside(0, 1, 2, 3, 4, 5)];

/** What a Turn played on `card` banks when the Player stops at the end. */
const bankedOn = (
  card: Card,
  ...events: Parameters<typeof applyEvent>[1][]
) =>
  play(applyEvent(newGame(), draw(card)), ...events, { type: "stop" }).seats[0]
    .score;

/** Draws one `card` and plays the shortest possible Turn out of the way. */
const spend = (state: GameState, card: Card): GameState => {
  const drawn = applyEvent(state, draw(card));
  const ended =
    drawn.turn.phase === "stopCard"
      ? drawn
      : applyEvent(drawn, roll(2, 2, 3, 3, 4, 6)); // a Niete
  return applyEvent(ended, { type: "nextTurn" });
};

describe("the deck", () => {
  it("holds the 56 Cards of the physical box", () => {
    const { deck } = newGame();

    expect(deck).toEqual({
      bonus200: 5,
      bonus300: 5,
      bonus400: 5,
      bonus500: 5,
      bonus600: 5,
      stop: 10,
      fireworks: 5,
      straight: 5,
      plusMinus: 5,
      x2: 5,
      cloverleaf: 1,
    });
    expect(cardsLeft(deck)).toBe(56);
  });
});

describe("a Roll", () => {
  it("shows the six faces that were thrown", () => {
    const game = applyEvent(started(), roll(1, 2, 3, 4, 5, 6));

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
    const before = play(started(), roll(1, 1, 1, 2, 3, 4));
    const snapshot = structuredClone(before);

    applyEvent(before, setAside(0, 1, 2));

    expect(before).toEqual(snapshot);
  });

  it("keeps the banked score and the score at risk apart", () => {
    const game = play(started(), roll(1, 2, 3, 4, 6, 6), setAside(0));

    expect(game.seats[0].score).toBe(0);
    expect(game.turn.score).toBe(100);
  });
});

describe("the scoring table", () => {
  const scoreOf = (faces: Face[], ...dice: number[]) =>
    play(started(), roll(...faces), setAside(...dice)).turn.score;

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
    // Setting all six aside is also a Tutto, so the Bonus 200 lands on top.
    expect(scoreOf([1, 1, 1, 1, 1, 1], 0, 1, 2, 3, 4, 5)).toBe(2000 + 200);
    expect(scoreOf([2, 2, 2, 2, 2, 2], 0, 1, 2, 3, 4, 5)).toBe(400 + 200);
  });

  it("refuses dice that score nothing", () => {
    const rolled = play(started(), roll(2, 2, 5, 3, 4, 6));

    expect(() => applyEvent(rolled, setAside(0, 1))).toThrow();
    expect(() => applyEvent(rolled, setAside(2, 0))).toThrow();
    expect(() => applyEvent(rolled, setAside())).toThrow();
  });

  it("refuses to set the same die aside twice", () => {
    const rolled = play(started(), roll(1, 2, 3, 4, 6, 6));

    expect(() => applyEvent(rolled, setAside(0, 0))).toThrow();
    expect(() => applyEvent(rolled, setAside(9))).toThrow();
  });
});

describe("rerolling", () => {
  it("throws only the dice that were not set aside", () => {
    const game = play(started(), roll(1, 1, 2, 3, 4, 6), setAside(0, 1));

    expect(game.turn.diceInHand).toBe(4);
    expect(() => applyEvent(game, roll(1, 1, 1, 1, 1, 1))).toThrow();
    expect(play(game, roll(5, 2, 3, 6)).turn.roll).toEqual([5, 2, 3, 6]);
  });

  it("scores nothing for a Drilling assembled across two Rolls", () => {
    // Two 2s stay in hand because a pair scores nothing; only the 1 goes aside.
    const first = play(started(), roll(2, 2, 1, 3, 4, 6), setAside(2));
    const second = applyEvent(first, roll(2, 5, 3, 4, 6));

    // The third 2 would complete a Drilling on the table, but not in one Roll.
    expect(() => applyEvent(second, setAside(0))).toThrow();
    expect(play(second, setAside(1)).turn.score).toBe(150);
  });
});

describe("the next Turn", () => {
  const stopped = () =>
    play(started(), roll(1, 2, 3, 4, 6, 6), setAside(0), { type: "stop" });

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
      started(),
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
    // 1200 rolled plus the 200 of the Bonus Card the Turn started on.
    const game = tutto();

    expect(game.turn.score).toBe(1400);
    expect(
      play(game, draw("bonus300"), roll(1, 1, 1, 1, 1, 1), setAside(0, 1, 2))
        .turn.score,
    ).toBe(2400);
  });

  it("lets the Player stop and bank instead of rolling on", () => {
    expect(play(tutto(), { type: "stop" }).seats[0].score).toBe(1400);
  });

  it("makes rolling on cost a new Card first", () => {
    expect(() => applyEvent(tutto(), roll(1, 1, 1, 1, 1, 1))).toThrow();
    expect(play(tutto(), draw("bonus300")).turn.card).toBe("bonus300");
  });

  it("stops being announced once the Player rolls on", () => {
    expect(
      play(tutto(), draw("bonus300"), roll(1, 2, 3, 4, 5, 6)).turn.tutto,
    ).toBe(false);
  });
});

describe("stopping", () => {
  it("banks the Turn score", () => {
    const game = play(
      started(),
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
    expect(() => applyEvent(started(), { type: "stop" })).toThrow();
  });

  it("is refused while a Roll still awaits a decision", () => {
    const rolled = play(started(), roll(1, 1, 1, 2, 3, 4));

    expect(() => applyEvent(rolled, { type: "stop" })).toThrow();
  });
});

describe("a Null", () => {
  const nullRoll = () =>
    play(started(), roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2), roll(2, 3, 6));

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
      started(),
      roll(1, 2, 3, 4, 6, 6),
      setAside(0),
      { type: "stop" },
      { type: "nextTurn" },
      draw("bonus200"),
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

describe("drawing a Card", () => {
  it("comes before the first Roll of a Turn", () => {
    expect(() => applyEvent(newGame(), roll(1, 2, 3, 4, 5, 6))).toThrow();
    expect(started().turn.card).toBe("bonus200");
  });

  it("happens once per Card, not before every Roll", () => {
    expect(() => applyEvent(started(), draw("bonus300"))).toThrow();
  });

  it("takes that Card out of the deck", () => {
    const game = started();

    expect(game.deck.bonus200).toBe(4);
    expect(cardsLeft(game.deck)).toBe(55);
  });

  it("cannot draw a Card the deck has run out of", () => {
    const game = spend(newGame(), "cloverleaf");

    expect(game.deck.cloverleaf).toBe(0);
    expect(() => applyEvent(game, draw("cloverleaf"))).toThrow();
  });

  it("refills the deck to the full 56 once the last Card is gone", () => {
    const box = newGame().deck;
    let game: GameState = newGame();
    let drawn = 0;

    for (const card of CARDS) {
      for (let copy = 0; copy < box[card]; copy++) {
        game = spend(game, card);
        drawn++;
        // The reshuffle only happens once all 56 have been drawn.
        if (drawn < 56) expect(cardsLeft(game.deck)).toBe(56 - drawn);
      }
    }

    expect(drawn).toBe(56);
    expect(game.deck).toEqual(box);
  });
});

describe("a Bonus Card", () => {
  it("adds its points when the Turn ends on a Tutto", () => {
    expect(bankedOn("bonus500", ...aTutto)).toBe(2500);
  });

  it("adds nothing when the Player stops without a Tutto", () => {
    expect(bankedOn("bonus500", roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2))).toBe(
      1000,
    );
  });

  it("is earned at the Tutto itself, not at the end of the Turn", () => {
    // The Card is spent and replaced at the Tutto, so the 500 is already in the
    // Turn score when the Player rolls on and later stops without a Tutto.
    const banked = bankedOn(
      "bonus500",
      ...aTutto,
      draw("bonus600"),
      roll(1, 2, 3, 4, 6, 6),
      setAside(0),
    );

    expect(banked).toBe(2500 + 100);
  });

  it("is forfeited with the rest of the Turn on a Niete", () => {
    const game = play(
      applyEvent(newGame(), draw("bonus500")),
      ...aTutto,
      draw("bonus600"),
      roll(2, 2, 3, 3, 4, 6),
    );

    expect(game.turn.phase).toBe("null");
    expect(game.seats[0].score).toBe(0);
  });
});

describe("an x2 Card", () => {
  it("doubles the whole Turn score when the Turn ends on a Tutto", () => {
    const banked = bankedOn(
      "x2",
      roll(1, 1, 1, 2, 3, 4),
      setAside(0, 1, 2),
      roll(1, 1, 5),
      setAside(0, 1, 2),
    );

    // 1000 from the first Roll and 250 from the second, then doubled.
    expect(banked).toBe(2500);
  });

  it("doubles nothing when the Player stops without a Tutto", () => {
    expect(bankedOn("x2", roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2))).toBe(1000);
  });

  it("doubles a Bonus already earned earlier in the Turn", () => {
    const banked = bankedOn("bonus400", ...aTutto, draw("x2"), ...aTutto);

    expect(banked).toBe((2000 + 400 + 2000) * 2);
  });
});

describe("a Stop Card", () => {
  const stopCard = () => applyEvent(newGame(), draw("stop"));

  it("ends the Turn the moment it is drawn", () => {
    const game = stopCard();

    expect(game.turn.phase).toBe("stopCard");
    expect(game.seats[0].score).toBe(0);
  });

  it("takes the points of a Turn that was already running", () => {
    const game = play(
      applyEvent(newGame(), draw("bonus600")),
      ...aTutto,
      draw("stop"),
    );

    expect(game.turn.phase).toBe("stopCard");
    expect(game.turn.score).toBe(0);
    expect(game.seats[0].score).toBe(0);
  });

  it("allows no further play in that Turn", () => {
    const game = stopCard();

    expect(() => applyEvent(game, roll(1, 1, 1, 1, 1, 1))).toThrow();
    expect(() => applyEvent(game, { type: "stop" })).toThrow();
    expect(() => applyEvent(game, draw("bonus200"))).toThrow();
  });

  it("is followed by the next Turn like any other ending", () => {
    const game = applyEvent(stopCard(), { type: "nextTurn" });

    expect(game.turn.card).toBeNull();
    expect(game.turn.diceInHand).toBe(6);
  });
});

describe("the Cards that are not built yet", () => {
  // Fireworks, Straße, Plus/Minus and Kleeblatt all take control of the Turn
  // away from the Player, which needs Seats and a Game ending. Until ticket 06
  // they are drawn and shown, and the Turn runs as if no Card were in force.
  it.each<Card>(["fireworks", "straight", "plusMinus", "cloverleaf"])(
    "leaves the Turn ordinary for now: %s",
    (card) => {
      expect(bankedOn(card, ...aTutto)).toBe(2000);
      expect(bankedOn(card, roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2))).toBe(
        1000,
      );
    },
  );
});
