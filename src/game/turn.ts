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

export type Seat = {
  /** What the Player typed in the lobby. No two Seats of one Game share one. */
  name: string;
  /**
   * The User this Seat belongs to, or `null` for a guest's (ADR 0002). An
   * opaque string here: the reducer never learns what a database id is.
   */
  owner: string | null;
  score: number;
  /** Turns this Seat has finished. The Final round ends when all are equal. */
  turnsTaken: number;
};

/**
 * The Cards that take the choice away: the Player rolls on until the Card is
 * satisfied or the Turn dies. None of them may be stopped on.
 */
const FORCING: Card[] = ["fireworks", "plusMinus", "cloverleaf"];

/**
 * What a Card is worth to a Turn that reaches a Tutto: extra points, then a
 * multiplier. A completed Straße is a Tutto worth 2000, and the dice it is made
 * of score nothing on their own, so its whole value sits here.
 */
const CARD_BONUS: Record<Card, number> = {
  bonus200: 200,
  bonus300: 300,
  bonus400: 400,
  bonus500: 500,
  bonus600: 600,
  stop: 0,
  fireworks: 0,
  straight: 2000,
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
  | "stopCard"
  /** The Kleeblatt came in: this Turn won the Game outright. */
  | "won";

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
  /** Tuttos reached since the Card in force was drawn. The Kleeblatt wants 2. */
  cardTuttos: number;
};

/**
 * Reaching 6000 does not win. It opens the Final round, which runs until every
 * Seat has taken the same number of Turns; only then does the highest score
 * win, and the Seat that crossed 6000 first may well not be it.
 */
const FINAL_ROUND_SCORE = 6000;

/**
 * A Game waits in its lobby while the Players take their Seats, and is started
 * by hand: from then on the Seats are fixed and play in the order they joined.
 */
export type GamePhase = "lobby" | "playing" | "finalRound" | "over";

export type GameState = {
  seats: Seat[];
  activeSeatIndex: number;
  phase: GamePhase;
  deck: Deck;
  turn: Turn;
};

/**
 * The Seats on the top score — the winners once the Game is over, and the
 * Seats a Plus/Minus deducts from while it is running. Several when tied.
 */
export function leadingSeats(seats: Seat[]): number[] {
  const top = Math.max(...seats.map((seat) => seat.score));
  return seats.flatMap((seat, index) => (seat.score === top ? [index] : []));
}

/**
 * Who won: the Seat whose Kleeblatt came in, which wins from any score, or
 * else the top score — several of them when the Game ended tied.
 */
export function winners(state: GameState): number[] {
  return state.turn.phase === "won"
    ? [state.activeSeatIndex]
    : leadingSeats(state.seats);
}

/**
 * Two names are one name at the same table, whatever the capitals and whatever
 * was typed either side of them.
 */
const sameName = (one: string, other: string): boolean =>
  one.trim().toLowerCase() === other.trim().toLowerCase();

/**
 * Whether this name is already at this table. Names are unique inside one Game
 * and nowhere else, so the same name in another Game is somebody else's affair.
 * Exported so the lobby can say why a name is refused before it is tried.
 */
export const seatNameTaken = (state: GameState, name: string): boolean =>
  state.seats.some((seat) => sameName(seat.name, name));

/**
 * Whether this Seat may make the next move: only the Seat whose Turn it is,
 * and only while the Game is running. That is a rule, so it lives here with the
 * others — whether the caller really *is* that Seat is a secret comparison and
 * lives in the mutation (ADR 0004).
 */
export const seatMayPlay = (state: GameState, seatIndex: number): boolean =>
  (state.phase === "playing" || state.phase === "finalRound") &&
  seatIndex === state.activeSeatIndex;

export type GameEvent =
  | { type: "takeSeat"; name: string }
  | { type: "start" }
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
 * three times. A Roll with none of these is a Null. A Straße replaces that
 * table outright — a die counts when its number is not on the table yet.
 */
export function validDice(
  faces: Face[],
  card: Card | null = null,
  setAside: Face[] = [],
): boolean[] {
  if (card === "straight") {
    const already = new Set<Face>(setAside);
    return faces.map((face) => !already.has(face));
  }
  const counts = countByFace(faces);
  return faces.map(
    (face) => face === 1 || face === 5 || counts[face] >= TRIPLET_SIZE,
  );
}

/**
 * What a set of dice chosen from one Roll is worth, or `null` when the choice
 * is illegal because at least one of its dice scores nothing. Under a Straße
 * every die is worth nothing on its own: the 2000 comes with the sixth number.
 */
export function scoreSelection(
  faces: Face[],
  card: Card | null = null,
  setAside: Face[] = [],
): number | null {
  if (faces.length === 0) return null;
  if (card === "straight") {
    const already = new Set<Face>(setAside);
    for (const face of faces) {
      if (already.has(face)) return null;
      already.add(face);
    }
    return 0;
  }
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
  cardTuttos: 0,
});

/**
 * Whether the Player may end the Turn here and bank it. A forcing Card takes
 * that away, so the UI must not offer it rather than offer a move that throws.
 */
export function canStop(state: GameState): boolean {
  const { turn } = state;
  const decidable =
    turn.phase === "awaitingRoll" || turn.phase === "awaitingCard";
  const forced = turn.card !== null && FORCING.includes(turn.card);
  return state.phase !== "over" && decidable && !forced && turn.score > 0;
}

/** What a Plus/Minus pays and takes, and what a Kleeblatt asks for. */
const PLUS_MINUS_SCORE = 1000;
const CLOVERLEAF_TUTTOS = 2;

/**
 * A Plus/Minus that got its Tutto: the Card pays a flat 1000 whatever the dice
 * were worth, every Seat in the lead pays 1000 — the rolling Seat never to
 * itself — and no score goes below zero. The Turn is over: the Card's demand
 * was the whole of it.
 */
function plusMinus(state: GameState, done: Turn): GameState {
  // Who leads is read before the 1000 is paid, so paying it cannot make the
  // rolling Seat the leader that then has to hand it back.
  const leaders = leadingSeats(state.seats);
  const seats = state.seats.map((seat, index) =>
    index !== state.activeSeatIndex && leaders.includes(index)
      ? { ...seat, score: Math.max(0, seat.score - PLUS_MINUS_SCORE) }
      : seat,
  );
  const paid = bank({ ...state, seats }, PLUS_MINUS_SCORE);
  return {
    ...paid,
    turn: { ...done, phase: "stopped", score: PLUS_MINUS_SCORE },
  };
}

/**
 * Points into the active Seat, plus the check that goes with every rise: 6000
 * opens the Final round wherever it is crossed, not only when stopping.
 */
function bank(state: GameState, points: number): GameState {
  const seats = state.seats.map((seat, index) =>
    index === state.activeSeatIndex
      ? { ...seat, score: seat.score + points }
      : seat,
  );
  return {
    ...state,
    seats,
    phase: seats.some((seat) => seat.score >= FINAL_ROUND_SCORE)
      ? "finalRound"
      : state.phase,
  };
}

/**
 * A new Game is an empty lobby. Players take a Seat each and it is started by
 * hand; Seats then play in join order, the Player who created it first. Equal
 * Turn counts make that fair, so the order is never configured.
 */
export function newGame(): GameState {
  return {
    seats: [],
    activeSeatIndex: 0,
    phase: "lobby",
    deck: fullDeck(),
    turn: newTurn(),
  };
}

export function applyEvent(state: GameState, event: GameEvent): GameState {
  // Taking a Seat and starting belong to the lobby and nothing else does.
  const lobbyEvent = event.type === "takeSeat" || event.type === "start";
  if (state.phase === "lobby" && !lobbyEvent) {
    throw new Error("The Game has not started");
  }
  if (state.phase !== "lobby" && lobbyEvent) {
    throw new Error("The Game has already started");
  }
  if (state.phase === "over") throw new Error("The Game is over");
  switch (event.type) {
    case "takeSeat": {
      const name = event.name.trim();
      if (name === "") throw new Error("A Seat is taken under a name");
      if (seatNameTaken(state, name)) {
        throw new Error("That name is already taken in this Game");
      }
      // A guest's Seat has no owner; signing up claims it later (ADR 0002).
      return {
        ...state,
        seats: [...state.seats, { name, owner: null, score: 0, turnsTaken: 0 }],
      };
    }
    case "start": {
      if (state.seats.length === 0) {
        throw new Error("A Game needs a Seat to be started");
      }
      return { ...state, phase: "playing" };
    }
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
          cardTuttos: 0,
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
      const isNull = !validDice(event.faces, turn.card, turn.setAside).some(
        Boolean,
      );
      // A Feuerwerk can only end on a Null, so that ending is not a punishment:
      // the Turn banks everything it rolled instead of forfeiting it.
      const banks = isNull && turn.card === "fireworks";
      return {
        ...(banks ? bank(state, turn.score) : state),
        turn: {
          ...turn,
          phase: isNull ? "null" : "awaitingSetAside",
          roll: event.faces,
          // A Null forfeits the Turn, so nothing stays on the table.
          setAside: isNull ? [] : turn.setAside,
          score: isNull && !banks ? 0 : turn.score,
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
      const score = scoreSelection(chosen, turn.card, turn.setAside);
      if (score === null) throw new Error("Those dice score nothing");
      const left = turn.diceInHand - chosen.length;
      const tutto = left === 0;
      const rolled = turn.score + score;
      if (!tutto) {
        return {
          ...state,
          turn: {
            ...turn,
            phase: "awaitingRoll",
            roll: null,
            diceInHand: left,
            setAside: [...turn.setAside, ...chosen],
            score: rolled,
            tutto: false,
          },
        };
      }
      // A Tutto returns every die to the hand and clears the table. Rolling on
      // normally costs a new Card, but a Card that is still owed something —
      // the Feuerwerk its Null, the Kleeblatt its second Tutto — stays in force.
      const carried = tuttoScore(rolled, turn.card);
      const cardTuttos = turn.cardTuttos + 1;
      const stays = turn.card === "fireworks" || turn.card === "cloverleaf";
      const done: Turn = {
        ...turn,
        phase: stays ? "awaitingRoll" : "awaitingCard",
        roll: null,
        diceInHand: DICE_COUNT,
        setAside: [],
        score: carried,
        tutto: true,
        cardTuttos,
      };
      // The Kleeblatt's second Tutto wins the Game there and then, whatever the
      // scores say and whether or not the Final round has begun.
      if (turn.card === "cloverleaf" && cardTuttos === CLOVERLEAF_TUTTOS) {
        return {
          ...bank(state, carried),
          phase: "over",
          turn: { ...done, phase: "won" },
        };
      }
      if (turn.card === "plusMinus") return plusMinus(state, done);
      return { ...state, turn: done };
    }
    case "stop": {
      const { turn } = state;
      if (!canStop(state)) throw new Error("The Player cannot stop now");
      // Crossing 6000 opens the Final round; it never ends the Game.
      const banked = bank(state, turn.score);
      return { ...banked, turn: { ...turn, phase: "stopped" } };
    }
    case "nextTurn": {
      const over =
        state.turn.phase === "stopped" ||
        state.turn.phase === "null" ||
        state.turn.phase === "stopCard";
      if (!over) throw new Error("The Turn is not over");
      const seats = state.seats.map((seat, index) =>
        index === state.activeSeatIndex
          ? { ...seat, turnsTaken: seat.turnsTaken + 1 }
          : seat,
      );
      // In the Final round the Game ends the moment Turn counts are level, so
      // that going first is worth nothing.
      const level = seats.every(
        (seat) => seat.turnsTaken === seats[0].turnsTaken,
      );
      if (state.phase === "finalRound" && level) {
        // The finished Turn stays on the table: it is the last thing that
        // happened, and nothing more may be played.
        return { ...state, seats, phase: "over" };
      }
      return {
        ...state,
        seats,
        activeSeatIndex: (state.activeSeatIndex + 1) % seats.length,
        turn: newTurn(),
      };
    }
  }
}
