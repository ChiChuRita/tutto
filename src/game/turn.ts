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
const DICE_PER_TURN = 6;
const ALL_FACES: Face[] = [1, 2, 3, 4, 5, 6];

export type Seat = { score: number };

export type TurnPhase =
  "awaitingRoll" | "awaitingSetAside" | "niete" | "stopped";

export type Turn = {
  phase: TurnPhase;
  /** Dice the next Roll will throw. */
  diceInHand: number;
  /** The Roll awaiting a decision, or the Roll that was a Niete. */
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
  turn: Turn;
};

export type GameEvent =
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
 * three times. A Roll with none of these is a Niete.
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
  phase: "awaitingRoll",
  diceInHand: DICE_PER_TURN,
  roll: null,
  setAside: [],
  score: 0,
  tutto: false,
});

export function newGame(): GameState {
  return { seats: [{ score: 0 }], activeSeatIndex: 0, turn: newTurn() };
}

export function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "roll": {
      const { turn } = state;
      if (turn.phase !== "awaitingRoll") {
        throw new Error("The Player cannot roll now");
      }
      if (event.faces.length !== turn.diceInHand) {
        throw new Error("A Roll throws exactly the dice in hand");
      }
      const isNiete = !validDice(event.faces).some(Boolean);
      return {
        ...state,
        turn: {
          ...turn,
          phase: isNiete ? "niete" : "awaitingSetAside",
          roll: event.faces,
          score: isNiete ? 0 : turn.score,
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
      return {
        ...state,
        turn: {
          ...turn,
          phase: "awaitingRoll",
          roll: null,
          // A Tutto returns every die to the hand and clears the table.
          diceInHand: tutto ? DICE_PER_TURN : left,
          setAside: tutto ? [] : [...turn.setAside, ...chosen],
          score: turn.score + score,
          tutto,
        },
      };
    }
    case "stop": {
      const { turn } = state;
      if (turn.phase !== "awaitingRoll" || turn.score === 0) {
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
      if (state.turn.phase !== "stopped" && state.turn.phase !== "niete") {
        throw new Error("The Turn is not over");
      }
      // Ticket 05 passes play to the next Seat here.
      return { ...state, turn: newTurn() };
    }
  }
}
