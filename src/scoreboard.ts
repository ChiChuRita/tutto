import { seatMayPlay, type GameState } from "./game/turn";

/**
 * The two things a Player checks between taps, and the whole of the collapsed
 * scoreboard: whose Turn it is, and where this device stands. Every other
 * Seat's score is behind the tap, because a row per Seat costs about 104px on a
 * phone and that is what the Card and the sixth die need.
 *
 * A function rather than two conditions in the markup because of the third
 * case: a Spectator holds no Seat and so has no score to report, and the row
 * still has to say something. What it says instead is the truth about where
 * they stand — they are watching — never an empty half-row.
 */
export type ScoreboardRow = {
  /** Whose Turn it is, by name, or that it is yours. */
  turn: string;
  /** What this device has on the table, or what it is doing here instead. */
  standing: string;
  /**
   * This device's score, or `null` for a Spectator, who has none — then
   * `standing` is the whole of it. A number rather than a finished sentence
   * because the row counts it to its new value rather than printing it, and a
   * count needs the number itself.
   */
  score: number | null;
};

export function scoreboardRow(
  state: GameState,
  /** This device's Seat, or `null` for a Spectator. */
  mySeat: number | null,
): ScoreboardRow {
  const active = state.seats[state.activeSeatIndex];
  return {
    turn:
      mySeat !== null && seatMayPlay(state, mySeat)
        ? "Du bist am Zug."
        : `${active.name} ist am Zug.`,
    standing: mySeat === null ? "Du schaust zu." : "Du:",
    score: mySeat === null ? null : state.seats[mySeat].score,
  };
}
