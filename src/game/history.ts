import type { Card, Face, GameEvent, GameState, Turn } from "./turn";

/**
 * What a finished Turn leaves behind. History cannot be reconstructed from a
 * position later, so it is written as it happens: every Card drawn, every
 * Roll's faces, every set-aside and which of them was a TUTTO, and how the
 * Turn ended. Reading it back replays the Turn move for move.
 *
 * This is pure derivation from the reducer's own events and results — it holds
 * no rules of its own, so recording can never change how a Game plays.
 */
export type TurnStep =
  | { type: "draw"; card: Card }
  | { type: "roll"; faces: Face[] }
  | { type: "setAside"; faces: Face[]; tutto: boolean };

/**
 * The four ways the rules end a Turn, plus the one the Player ends by walking
 * away from the Game. A Feuerwerk's `null` banks its points all the same, and
 * `won` is the Kleeblatt taking the Game outright.
 */
export type TurnEnding = "stopped" | "null" | "stopCard" | "won" | "abandoned";

export type RecordedTurn = {
  steps: TurnStep[];
  ending: TurnEnding | null;
};

/** What an event added to the record, or `null` when it added nothing. */
export function turnStep(
  before: GameState,
  event: GameEvent,
  after: GameState,
): TurnStep | null {
  switch (event.type) {
    case "draw":
      return { type: "draw", card: event.card };
    case "roll":
      return { type: "roll", faces: event.faces };
    case "setAside": {
      const rolled = before.turn.roll ?? [];
      return {
        type: "setAside",
        faces: event.dice.map((die) => rolled[die]),
        tutto: after.turn.tutto,
      };
    }
    // Stopping and starting the next Turn are endings and beginnings, not moves.
    case "stop":
    case "nextTurn":
      return null;
  }
}

/** How this Turn ended, or `null` while it is still being played. */
export function turnEnding(turn: Turn): TurnEnding | null {
  switch (turn.phase) {
    case "stopped":
    case "null":
    case "stopCard":
    case "won":
      return turn.phase;
    default:
      return null;
  }
}
