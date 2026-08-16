import { describe, expect, it } from "vitest";
import {
  applyEvent,
  canStop,
  cardsLeft,
  CARDS,
  leadingSeats,
  newGame,
  scoreSelection,
  seatMayPlay,
  seatNameTaken,
  validDice,
  winners,
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
 * Taking a Seat, as a guest unless a User is named. The owner is an opaque
 * string here exactly as it is to the reducer — the real one is a Convex id,
 * which never gets in (ADR 0002).
 */
const takeSeat = (name: string, owner: string | null = null) => ({
  type: "takeSeat" as const,
  name,
  owner,
});
const start = { type: "start" as const };

/**
 * A Game past its lobby, with as many Seats as asked for. Every Game gets here
 * the way a real one does — Players take a Seat each, then it is started — so
 * the tests below all play on Seats in join order.
 */
const inPlay = (seatCount = 1): GameState =>
  play(
    newGame(),
    ...Array.from({ length: seatCount }, (_, index) =>
      takeSeat(`Spieler ${index + 1}`),
    ),
    start,
  );

/**
 * A Turn always starts on a Card, so the dice tests start on a Bonus — the
 * Card that changes nothing until the Turn reaches a Tutto.
 */
const started = () => applyEvent(inPlay(), draw("bonus200"));

/** Six 1s set aside in one Roll: a Tutto, worth 2000 before any Card. */
const aTutto = [roll(1, 1, 1, 1, 1, 1), setAside(0, 1, 2, 3, 4, 5)];

/** What a Turn played on `card` banks when the Player stops at the end. */
const bankedOn = (card: Card, ...events: Parameters<typeof applyEvent>[1][]) =>
  play(applyEvent(inPlay(), draw(card)), ...events, { type: "stop" }).seats[0]
    .score;

/** Draws one `card` and plays the shortest losing Turn out of the way. */
const spend = (state: GameState, card: Card): GameState => {
  const drawn = applyEvent(state, draw(card));
  const ended =
    drawn.turn.phase === "stopCard"
      ? drawn
      : card === "straight"
        ? // Under a Straße every number of the first Roll is new, so the
          // shortest Niete takes a second Roll that repeats what is down.
          play(drawn, roll(1, 2, 3, 4, 5, 6), setAside(0), roll(1, 1, 1, 1, 1))
        : applyEvent(drawn, roll(2, 2, 3, 3, 4, 6)); // a Niete
  return applyEvent(ended, { type: "nextTurn" });
};

/** A Game whose Seats already hold these scores, the first of them to play. */
const gameWith = (...scores: number[]): GameState => {
  const game = inPlay(scores.length);
  return {
    ...game,
    seats: game.seats.map((seat, index) => ({ ...seat, score: scores[index] })),
  };
};

const names = (state: GameState) => state.seats.map((seat) => seat.name);

describe("the lobby", () => {
  it("opens a new Game with nobody in it and nothing played", () => {
    expect(newGame().seats).toEqual([]);
    expect(newGame().phase).toBe("lobby");
  });

  it("seats a Player under the name they gave", () => {
    const game = applyEvent(newGame(), takeSeat("Anna"));

    expect(names(game)).toEqual(["Anna"]);
    expect(game.seats[0].score).toBe(0);
  });

  it("leaves a guest's Seat unowned", () => {
    const game = applyEvent(newGame(), takeSeat("Anna"));

    expect(game.seats[0].owner).toBe(null);
  });

  it("records the User a signed-in Player's Seat belongs to", () => {
    const game = applyEvent(newGame(), takeSeat("Anna", "user-anna"));

    expect(game.seats[0].owner).toBe("user-anna");
  });

  it("seats a signed-in Player and a guest at the same table", () => {
    const game = play(
      newGame(),
      takeSeat("Anna", "user-anna"),
      takeSeat("Bert"),
    );

    expect(names(game)).toEqual(["Anna", "Bert"]);
    expect(game.seats.map((seat) => seat.owner)).toEqual(["user-anna", null]);
  });

  it("keeps the Seats in the order they were taken", () => {
    const game = play(
      newGame(),
      takeSeat("Anna"),
      takeSeat("Bert"),
      takeSeat("Cem"),
    );

    expect(names(game)).toEqual(["Anna", "Bert", "Cem"]);
  });

  it("refuses a name that is already at this table", () => {
    const game = applyEvent(newGame(), takeSeat("Anna"));

    expect(seatNameTaken(game, "Anna")).toBe(true);
    expect(() => applyEvent(game, takeSeat("Anna"))).toThrow();
  });

  it("counts a name as taken whatever the capitals and spaces around it", () => {
    const game = applyEvent(newGame(), takeSeat("Anna"));

    expect(seatNameTaken(game, " anna ")).toBe(true);
    expect(() => applyEvent(game, takeSeat(" anna "))).toThrow();
  });

  it("allows the same name at another table", () => {
    play(newGame(), takeSeat("Anna"));

    expect(seatNameTaken(newGame(), "Anna")).toBe(false);
    expect(names(applyEvent(newGame(), takeSeat("Anna")))).toEqual(["Anna"]);
  });

  it("refuses a Seat with no name", () => {
    expect(() => applyEvent(newGame(), takeSeat("   "))).toThrow();
  });

  it("takes the name as typed, without the spaces around it", () => {
    expect(names(applyEvent(newGame(), takeSeat("  Anna  ")))).toEqual([
      "Anna",
    ]);
  });

  it("refuses a Seat once the Game has started", () => {
    expect(() => applyEvent(inPlay(1), takeSeat("Bert"))).toThrow();
  });

  it("refuses to start a Game nobody is in", () => {
    expect(() => applyEvent(newGame(), start)).toThrow();
  });

  it("starts a Game on the Seat that joined first", () => {
    const game = play(newGame(), takeSeat("Anna"), takeSeat("Bert"), start);

    expect(game.phase).toBe("playing");
    expect(game.activeSeatIndex).toBe(0);
  });

  it("starts a Game with a single Seat in it", () => {
    const game = play(newGame(), takeSeat("Anna"), start);

    expect(game.phase).toBe("playing");
    expect(names(game)).toEqual(["Anna"]);
  });

  it("refuses to start a Game that is already running", () => {
    expect(() => applyEvent(inPlay(1), start)).toThrow();
  });

  it("allows no play before the Game is started", () => {
    const lobby = applyEvent(newGame(), takeSeat("Anna"));

    expect(() => applyEvent(lobby, draw("bonus200"))).toThrow();
    expect(() => applyEvent(lobby, { type: "nextTurn" })).toThrow();
  });
});

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

  // Every die in a Roll can be picked up, so this refusal is the whole of what
  // stops a selection that scores nothing — and it is what greys out
  // »herauslegen« and what the server checks, from the one function.
  it("refuses a selection with no 1, no 5 and no whole triplet", () => {
    const game = play(started(), roll(2, 2, 3, 3, 4, 6));

    expect(scoreSelection([2, 3])).toBeNull();
    expect(scoreSelection([2, 2])).toBeNull();
    expect(scoreSelection([1, 4])).toBeNull();
    expect(scoreSelection([1, 5])).toBe(150);
    expect(() => applyEvent(game, setAside(0, 2))).toThrow();
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
    expect(() => applyEvent(inPlay(), { type: "nextTurn" })).toThrow();
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
    expect(() => applyEvent(inPlay(), roll(1, 2, 3, 4, 5, 6))).toThrow();
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
    const game = spend(inPlay(), "cloverleaf");

    expect(game.deck.cloverleaf).toBe(0);
    expect(() => applyEvent(game, draw("cloverleaf"))).toThrow();
  });

  it("refills the deck to the full 56 once the last Card is gone", () => {
    const box = newGame().deck;
    let game: GameState = inPlay();
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
    expect(
      bankedOn("bonus500", roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2)),
    ).toBe(1000);
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
      applyEvent(inPlay(), draw("bonus500")),
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
    expect(bankedOn("x2", roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2))).toBe(
      1000,
    );
  });

  it("doubles a Bonus already earned earlier in the Turn", () => {
    const banked = bankedOn("bonus400", ...aTutto, draw("x2"), ...aTutto);

    expect(banked).toBe((2000 + 400 + 2000) * 2);
  });
});

describe("a Stop Card", () => {
  const stopCard = () => applyEvent(inPlay(), draw("stop"));

  it("ends the Turn the moment it is drawn", () => {
    const game = stopCard();

    expect(game.turn.phase).toBe("stopCard");
    expect(game.seats[0].score).toBe(0);
  });

  it("takes the points of a Turn that was already running", () => {
    const game = play(
      applyEvent(inPlay(), draw("bonus600")),
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

/** A Roll with no 1, no 5 and no Drilling: a Niete under the normal rules. */
const niete = roll(2, 2, 3, 3, 4, 6);

describe("a Feuerwerk Card", () => {
  const fireworks = () => applyEvent(inPlay(), draw("fireworks"));

  it("offers no way to stop, however well the Turn is going", () => {
    const game = play(fireworks(), roll(1, 1, 1, 2, 3, 4), setAside(0, 1, 2));

    expect(game.turn.score).toBe(1000);
    expect(canStop(game)).toBe(false);
    expect(() => applyEvent(game, { type: "stop" })).toThrow();
  });

  it("continues after a Tutto without drawing a new Card", () => {
    const game = play(fireworks(), ...aTutto);

    expect(game.turn.card).toBe("fireworks");
    expect(game.turn.diceInHand).toBe(6);
    expect(() => applyEvent(game, draw("bonus200"))).toThrow();
    expect(play(game, roll(1, 1, 1, 1, 1, 1)).turn.roll).toEqual([
      1, 1, 1, 1, 1, 1,
    ]);
  });

  it("banks every point of the Turn when it ends on a Niete", () => {
    const game = play(fireworks(), ...aTutto, niete);

    expect(game.turn.phase).toBe("null");
    expect(game.seats[0].score).toBe(2000);
  });

  it("banks nothing when the very first Roll is a Niete", () => {
    const game = play(fireworks(), niete);

    expect(game.turn.phase).toBe("null");
    expect(game.seats[0].score).toBe(0);
  });

  it("opens the Final round when the points it banks reach 6000", () => {
    const game = play(
      applyEvent(gameWith(4000, 0), draw("fireworks")),
      ...aTutto,
      niete,
    );

    expect(game.seats[0].score).toBe(6000);
    expect(game.phase).toBe("finalRound");
  });
});

describe("a Plus/Minus Card", () => {
  /** Draws the Card and reaches the Tutto it demands, in one Roll of six 1s. */
  const won = (state: GameState) =>
    play(state, draw("plusMinus"), ...aTutto).seats.map((seat) => seat.score);

  it("offers no way to stop before the Tutto", () => {
    const game = play(
      applyEvent(inPlay(), draw("plusMinus")),
      roll(1, 1, 1, 2, 3, 4),
      setAside(0, 1, 2),
    );

    expect(canStop(game)).toBe(false);
    expect(() => applyEvent(game, { type: "stop" })).toThrow();
  });

  it("scores nothing for anyone when the Turn ends on a Niete", () => {
    const game = play(gameWith(0, 3000), draw("plusMinus"), niete);

    expect(game.turn.phase).toBe("null");
    expect(scores(game)).toEqual([0, 3000]);
  });

  it("scores exactly 1000, whatever the Turn had rolled", () => {
    // Six 1s are worth 2000, and the Turn already carried a Tutto's 2200.
    const game = play(
      applyEvent(inPlay(), draw("bonus200")),
      ...aTutto,
      draw("plusMinus"),
      ...aTutto,
    );

    expect(game.seats[0].score).toBe(1000);
    expect(game.turn.phase).toBe("stopped");
  });

  it("deducts 1000 from the leading Seat", () => {
    expect(won(gameWith(500, 3000, 1000))).toEqual([1500, 2000, 1000]);
  });

  it("deducts 1000 from every tied leader, and gains 1000 only once", () => {
    expect(won(gameWith(500, 3000, 3000))).toEqual([1500, 2000, 2000]);
  });

  it("deducts nothing from the rolling Seat when it is the one leading", () => {
    expect(won(gameWith(3000, 1000))).toEqual([4000, 1000]);
  });

  it("never pushes a score below zero", () => {
    expect(won(gameWith(0, 400))).toEqual([1000, 0]);
  });

  it("opens the Final round when its 1000 reaches 6000", () => {
    const game = play(gameWith(5000, 100), draw("plusMinus"), ...aTutto);

    expect(scores(game)).toEqual([6000, 100]);
    expect(game.phase).toBe("finalRound");
  });
});

describe("a Straße Card", () => {
  const straight = () => applyEvent(inPlay(), draw("straight"));
  /** 1 through 6 in one Roll: the whole Straße at once. */
  const sixInARow = [roll(1, 2, 3, 4, 5, 6), setAside(0, 1, 2, 3, 4, 5)];

  it("counts any number not yet set aside as valid, and nothing else", () => {
    expect(validDice([2, 2, 3, 3, 4, 6], "straight", [3, 1])).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
  });

  it("refuses the same number twice", () => {
    const game = play(straight(), roll(2, 2, 3, 4, 5, 6));

    expect(scoreSelection([2, 2], "straight", [])).toBeNull();
    expect(scoreSelection([3], "straight", [3])).toBeNull();
    expect(() => applyEvent(game, setAside(0, 1))).toThrow();
    expect(play(game, setAside(0, 2, 3)).turn.setAside).toEqual([2, 3, 4]);
  });

  it("scores 2000 and counts as a Tutto when 1 through 6 are complete", () => {
    const game = play(straight(), ...sixInARow);

    expect(game.turn.tutto).toBe(true);
    expect(game.turn.score).toBe(2000);
    expect(game.turn.diceInHand).toBe(6);
  });

  it("collects its six numbers across as many Rolls as it takes", () => {
    const game = play(
      straight(),
      roll(4, 4, 4, 4, 4, 2), // only one 4 is new, and the 2 with it
      setAside(0, 5),
      roll(1, 1, 1, 1),
      setAside(0),
      roll(6, 6, 3),
      setAside(0, 2),
      roll(5),
      setAside(0),
    );

    expect(game.turn.tutto).toBe(true);
    expect(game.turn.score).toBe(2000);
  });

  it("lets the Player continue on a new Card after completing it", () => {
    const game = play(straight(), ...sixInARow, draw("bonus300"), ...aTutto);

    expect(canStop(game)).toBe(true);
    expect(play(game, { type: "stop" }).seats[0].score).toBe(2000 + 2000 + 300);
  });

  it("counts a Roll holding no new number as a Niete", () => {
    const game = play(
      straight(),
      roll(1, 2, 2, 2, 2, 2),
      setAside(0, 1),
      roll(1, 2, 1, 2),
    );

    expect(game.turn.phase).toBe("null");
    expect(game.seats[0].score).toBe(0);
  });
});

describe("a Kleeblatt Card", () => {
  const cloverleaf = (state: GameState = inPlay(2)) =>
    applyEvent(state, draw("cloverleaf"));

  it("offers no way to stop, and keeps itself in force after the first Tutto", () => {
    const game = play(cloverleaf(), ...aTutto);

    expect(game.phase).toBe("playing");
    expect(game.turn.card).toBe("cloverleaf");
    expect(canStop(game)).toBe(false);
    expect(() => applyEvent(game, { type: "stop" })).toThrow();
    expect(() => applyEvent(game, draw("bonus200"))).toThrow();
  });

  it("wins the Game outright on the second Tutto in a row", () => {
    const game = play(cloverleaf(), ...aTutto, ...aTutto);

    expect(game.phase).toBe("over");
    expect(winners(game)).toEqual([0]);
    expect(() => applyEvent(game, { type: "nextTurn" })).toThrow();
  });

  it("wins from behind, at any score, even in the Final round", () => {
    const behind = { ...gameWith(0, 6900), phase: "finalRound" as const };
    const game = play(cloverleaf(behind), ...aTutto, ...aTutto);

    expect(game.phase).toBe("over");
    expect(winners(game)).toEqual([0]);
    expect(leadingSeats(game.seats)).toEqual([1]);
  });

  it("loses the whole Turn on a Niete before the second Tutto", () => {
    const game = play(cloverleaf(), ...aTutto, niete);

    expect(game.turn.phase).toBe("null");
    expect(game.phase).toBe("playing");
    expect(scores(game)).toEqual([0, 0]);
  });
});

/** A Turn banking 100: one 1 set aside, then stop. */
const smallTurn = [
  draw("bonus200"),
  roll(1, 2, 3, 4, 6, 6),
  setAside(0),
  { type: "stop" as const },
];

/** A Turn ending in a Niete, banking nothing. */
const nietenTurn = [draw("bonus200"), roll(2, 2, 3, 3, 4, 6)];

/**
 * A Turn that chains a Tutto on each Card in turn and then stops. Each Tutto is
 * worth 2000 plus the Bonus, and the whole pile carries into the next one, so a
 * few Cards is all it takes to pass 6000 in one Turn.
 */
const bigTurn = (...cards: Card[]) => [
  ...cards.flatMap((card) => [draw(card), ...aTutto]),
  { type: "stop" as const },
];

const scores = (state: GameState) => state.seats.map((seat) => seat.score);
const turnsTaken = (state: GameState) =>
  state.seats.map((seat) => seat.turnsTaken);

describe("turn order", () => {
  it("passes play to the next Seat in join order, and round again", () => {
    const three = inPlay(3);

    const second = play(three, ...smallTurn, { type: "nextTurn" });
    expect(second.activeSeatIndex).toBe(1);

    const third = play(second, ...smallTurn, { type: "nextTurn" });
    expect(third.activeSeatIndex).toBe(2);

    const round = play(third, ...smallTurn, { type: "nextTurn" });
    expect(round.activeSeatIndex).toBe(0);
  });

  it("passes play on however the Turn ended", () => {
    const niete = play(inPlay(3), ...nietenTurn, { type: "nextTurn" });
    expect(niete.activeSeatIndex).toBe(1);

    const stopCard = play(inPlay(3), draw("stop"), { type: "nextTurn" });
    expect(stopCard.activeSeatIndex).toBe(1);
  });

  it("banks each Seat's points against that Seat alone", () => {
    const game = play(
      inPlay(3),
      ...smallTurn,
      { type: "nextTurn" },
      ...nietenTurn,
      { type: "nextTurn" },
      draw("bonus200"),
      roll(5, 2, 3, 4, 6, 6),
      setAside(0),
      { type: "stop" },
    );

    expect(scores(game)).toEqual([100, 0, 50]);
  });

  it("counts a Turn for the Seat that took it", () => {
    const game = play(
      inPlay(3),
      ...smallTurn,
      { type: "nextTurn" },
      ...nietenTurn,
      { type: "nextTurn" },
    );

    expect(turnsTaken(game)).toEqual([1, 1, 0]);
  });
});

describe("who may play", () => {
  it("lets the Seat whose Turn it is move", () => {
    expect(seatMayPlay(inPlay(2), 0)).toBe(true);
  });

  it("refuses every other Seat at the table", () => {
    expect(seatMayPlay(inPlay(2), 1)).toBe(false);
  });

  it("follows the Turn round the table", () => {
    const second = play(inPlay(2), ...nietenTurn, { type: "nextTurn" });

    expect(seatMayPlay(second, 1)).toBe(true);
    expect(seatMayPlay(second, 0)).toBe(false);
  });

  it("refuses a Seat that is not at this table", () => {
    expect(seatMayPlay(inPlay(1), 1)).toBe(false);
  });

  it("lets nobody play while the Game is still in its lobby", () => {
    expect(seatMayPlay(applyEvent(newGame(), takeSeat("Anna")), 0)).toBe(false);
  });

  it("still lets the active Seat play in the Final round", () => {
    const game = play(
      inPlay(2),
      ...bigTurn("bonus200", "bonus300", "bonus400"),
    );

    expect(game.phase).toBe("finalRound");
    expect(seatMayPlay(game, 0)).toBe(true);
  });

  it("lets nobody play once the Game is over", () => {
    const over = play(
      inPlay(),
      ...bigTurn("bonus200", "bonus300", "bonus400"),
      { type: "nextTurn" },
    );

    expect(over.phase).toBe("over");
    expect(seatMayPlay(over, 0)).toBe(false);
  });
});

describe("the Final round", () => {
  /** Banks 6900 for the Seat playing it: three chained Tuttos on Bonus Cards. */
  const past6000 = bigTurn("bonus200", "bonus300", "bonus400");

  it("opens when a Seat first reaches 6000, and does not end the Game", () => {
    const game = play(inPlay(3), ...past6000);

    expect(game.seats[0].score).toBe(6900);
    expect(game.phase).toBe("finalRound");
  });

  it("lets the remaining Seats take their Turn", () => {
    const game = play(inPlay(3), ...past6000, { type: "nextTurn" });

    expect(game.phase).toBe("finalRound");
    expect(game.activeSeatIndex).toBe(1);
  });

  it("ends the Game once every Seat has taken an equal number of Turns", () => {
    const game = play(
      inPlay(3),
      ...past6000,
      { type: "nextTurn" },
      ...smallTurn,
      { type: "nextTurn" },
      ...nietenTurn,
    );

    expect(game.phase).toBe("finalRound");
    expect(applyEvent(game, { type: "nextTurn" }).phase).toBe("over");
  });

  it("is won by the highest score, not by the Seat that crossed 6000 first", () => {
    const game = play(
      inPlay(3),
      ...past6000,
      { type: "nextTurn" },
      // The second Seat overtakes with a fourth Tutto in its equalising Turn.
      ...bigTurn("bonus200", "bonus300", "bonus400", "bonus500"),
      { type: "nextTurn" },
      ...smallTurn,
      { type: "nextTurn" },
    );

    expect(game.phase).toBe("over");
    expect(scores(game)).toEqual([6900, 9400, 100]);
    expect(leadingSeats(game.seats)).toEqual([1]);
  });

  it("names every Seat with the top score when they are tied", () => {
    const game = play(
      inPlay(3),
      ...past6000,
      { type: "nextTurn" },
      ...past6000,
      { type: "nextTurn" },
      ...smallTurn,
      { type: "nextTurn" },
    );

    expect(leadingSeats(game.seats)).toEqual([0, 1]);
  });

  it("ends a one-Seat Game as soon as that Seat's Turn is over", () => {
    const crossed = play(inPlay(), ...past6000);

    expect(crossed.phase).toBe("finalRound");
    expect(applyEvent(crossed, { type: "nextTurn" }).phase).toBe("over");
  });

  it("allows no further play once the Game is over", () => {
    const game = play(inPlay(), ...past6000, { type: "nextTurn" });

    expect(() => applyEvent(game, { type: "nextTurn" })).toThrow();
    expect(() => applyEvent(game, draw("bonus200"))).toThrow();
  });
});
