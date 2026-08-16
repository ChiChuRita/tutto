export type Face = 1 | 2 | 3 | 4 | 5 | 6;

/** The 2024 rulebook's scoring table. Deliberately not configurable. */
const TRIPLET_SIZE = 3;
const TRIPLET_SCORE: Record<Face, number> = {
  1: 1000,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
};
const SINGLE_SCORE: Record<Face, number> = {
  1: 100,
  2: 0,
  3: 0,
  4: 0,
  5: 50,
  6: 0,
};
const DICE_COUNT = 6;
const ALL_FACES: Face[] = [1, 2, 3, 4, 5, 6];

/**
 * The 56 Cards of the box, one name per distinct Card. The five Bonus values
 * are separate names so that the deck stays a flat count per Card (ADR 0003).
 */
export type Card =
  | "bonus200"
  | "bonus300"
  | "bonus400"
  | "bonus500"
  | "bonus600"
  | "stop"
  | "fireworks"
  | "straight"
  | "plusMinus"
  | "x2"
  | "cloverleaf";

export const CARDS: Card[] = [
  "bonus200",
  "bonus300",
  "bonus400",
  "bonus500",
  "bonus600",
  "stop",
  "fireworks",
  "straight",
  "plusMinus",
  "x2",
  "cloverleaf",
];

/** How many of each Card the box holds. Deliberately not configurable. */
const DISTRIBUTION: Record<Card, number> = {
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
};

/** How many of each Card is still to come — never in which order (ADR 0003). */
export type Deck = Record<Card, number>;

export const fullDeck = (): Deck => ({ ...DISTRIBUTION });

export const cardsLeft = (deck: Deck): number =>
  CARDS.reduce((total, card) => total + deck[card], 0);

export type Seat = { score: number };

/**
 * What a Card is worth to a Turn that reaches a Tutto: extra points, then a
 * multiplier. The four Cards that take control of the Turn away from the Player
 * — Feuerwerk, Straße, Plus/Minus, Kleeblatt — need Seats and a Game ending, so
 * until ticket 06 they are drawn and shown but leave the Turn ordinary.
 */
const CARD_BONUS: Record<Card, number> = {
  bonus200: 200,
  bonus300: 300,
  bonus400: 400,
  bonus500: 500,
  bonus600: 600,
  stop: 0,
  fireworks: 0,
  straight: 0,
  plusMinus: 0,
  x2: 0,
  cloverleaf: 0,
};

/** A Tutto's reward under the Card in force. */
const tuttoScore = (score: number, card: Card | null): number =>
  card === null ? score : (score + CARD_BONUS[card]) * (card === "x2" ? 2 : 1);

export type TurnPhase =
  | "awaitingCard"
  | "awaitingRoll"
  | "awaitingSetAside"
  | "null"
  | "stopped"
  | "stopCard";

export type Turn = {
  phase: TurnPhase;
  /** The Card face-up in front of the Player, drawn or not yet. */
  card: Card | null;
  /** Dice the next Roll will throw. */
  diceInHand: number;
  /** The Roll awaiting a decision, or the Roll that was a Null. */
  roll: Face[] | null;
  /** Faces set aside since the Turn started or the last Tutto. */
  setAside: Face[];
  /** Points at risk in this Turn. */
  score: number;
  /** The last set-aside completed a Tutto. */
  tutto: boolean;
};

export type GameState = {
  seats: Seat[];
  activeSeatIndex: number;
  deck: Deck;
  turn: Turn;
};

export type GameEvent =
  | { type: "draw"; card: Card }
  | { type: "roll"; faces: Face[] }
  | { type: "setAside"; dice: number[] }
  | { type: "stop" }
  | { type: "nextTurn" };

const countByFace = (faces: Face[]): Record<Face, number> => {
  const counts: Record<Face, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const face of faces) counts[face]++;
  return counts;
};

/**
 * Which dice of a Roll can be set aside: a 1, a 5, or a face thrown at least
 * three times. A Roll with none of these is a Null.
 */
export function validDice(faces: Face[]): boolean[] {
  const counts = countByFace(faces);
  return faces.map(
    (face) => face === 1 || face === 5 || counts[face] >= TRIPLET_SIZE,
  );
}

/**
 * What a set of dice chosen from one Roll is worth, or `null` when the choice
 * is illegal because at least one of its dice scores nothing.
 */
export function scoreSelection(faces: Face[]): number | null {
  if (faces.length === 0) return null;
  const counts = countByFace(faces);
  let total = 0;
  for (const face of ALL_FACES) {
    const triplets = Math.floor(counts[face] / TRIPLET_SIZE);
    const leftOver = counts[face] % TRIPLET_SIZE;
    // A die outside a triplet only counts if its face scores on its own.
    if (leftOver > 0 && SINGLE_SCORE[face] === 0) return null;
    total += triplets * TRIPLET_SCORE[face] + leftOver * SINGLE_SCORE[face];
  }
  return total;
}

const newTurn = (): Turn => ({
  phase: "awaitingCard",
  card: null,
  diceInHand: DICE_COUNT,
  roll: null,
  setAside: [],
  score: 0,
  tutto: false,
});

export function newGame(): GameState {
  return {
    seats: [{ score: 0 }],
    activeSeatIndex: 0,
    deck: fullDeck(),
    turn: newTurn(),
  };
}

export function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "draw": {
      const { turn } = state;
      if (turn.phase !== "awaitingCard") {
        throw new Error("There is no Card to draw now");
      }
      if (state.deck[event.card] < 1) {
        throw new Error("That Card is no longer in the deck");
      }
      const left = { ...state.deck, [event.card]: state.deck[event.card] - 1 };
      const stopped = event.card === "stop";
      return {
        ...state,
        // Drawing the last Card of the deck reshuffles all 56 back in.
        deck: cardsLeft(left) === 0 ? fullDeck() : left,
        turn: {
          ...turn,
          phase: stopped ? "stopCard" : "awaitingRoll",
          card: event.card,
          // A Stop Card ends the Turn on the spot and takes its points with it.
          score: stopped ? 0 : turn.score,
          setAside: stopped ? [] : turn.setAside,
          tutto: false,
        },
      };
    }
    case "roll": {
      const { turn } = state;
      if (turn.phase !== "awaitingRoll") {
        throw new Error("The Player cannot roll now");
      }
      if (event.faces.length !== turn.diceInHand) {
        throw new Error("A Roll throws exactly the dice in hand");
      }
      const isNull = !validDice(event.faces).some(Boolean);
      return {
        ...state,
        turn: {
          ...turn,
          phase: isNull ? "null" : "awaitingSetAside",
          roll: event.faces,
          // A Null forfeits the Turn, so nothing stays on the table.
          setAside: isNull ? [] : turn.setAside,
          score: isNull ? 0 : turn.score,
          tutto: false,
        },
      };
    }
    case "setAside": {
      const { turn } = state;
      if (turn.phase !== "awaitingSetAside" || turn.roll === null) {
        throw new Error("There is no Roll to set aside from");
      }
      const roll = turn.roll;
      const picked = new Set(event.dice);
      if (
        picked.size !== event.dice.length ||
        event.dice.some((die) => die < 0 || die >= roll.length)
      ) {
        throw new Error("Each die of the Roll can be set aside at most once");
      }
      const chosen = event.dice.map((die) => roll[die]);
      const score = scoreSelection(chosen);
      if (score === null) throw new Error("Those dice score nothing");
      const left = turn.diceInHand - chosen.length;
      const tutto = left === 0;
      const rolled = turn.score + score;
      return {
        ...state,
        turn: {
          ...turn,
          // Rolling on after a Tutto costs a new Card, and might cost the Turn.
          phase: tutto ? "awaitingCard" : "awaitingRoll",
          roll: null,
          // A Tutto returns every die to the hand and clears the table.
          diceInHand: tutto ? DICE_COUNT : left,
          setAside: tutto ? [] : [...turn.setAside, ...chosen],
          score: tutto ? tuttoScore(rolled, turn.card) : rolled,
          tutto,
        },
      };
    }
    case "stop": {
      const { turn } = state;
      const decidable =
        turn.phase === "awaitingRoll" || turn.phase === "awaitingCard";
      if (!decidable || turn.score === 0) {
        throw new Error("The Player cannot stop now");
      }
      return {
        ...state,
        seats: state.seats.map((seat, index) =>
          index === state.activeSeatIndex
            ? { ...seat, score: seat.score + turn.score }
            : seat,
        ),
        turn: { ...turn, phase: "stopped" },
      };
    }
    case "nextTurn": {
      const over =
        state.turn.phase === "stopped" ||
        state.turn.phase === "null" ||
        state.turn.phase === "stopCard";
      if (!over) throw new Error("The Turn is not over");
      // Ticket 05 passes play to the next Seat here.
      return { ...state, turn: newTurn() };
    }
  }
}
