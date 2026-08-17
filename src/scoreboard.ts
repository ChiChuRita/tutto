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
  /**
   * The settled position, and `null` on a screen that has just opened on a Roll
   * it has not yet shown landing. Every score in this row is news — a Plus/
   * Minus banks its flat 1000 and takes 1000 off each of the leaders in the one
   * move — so the row speaks from the settled position and never the live one.
   */
  state: GameState | null,
  /** This device's Seat, or `null` for a Spectator. */
  mySeat: number | null,
): ScoreboardRow {
  // Nothing has settled yet, so there is nothing this may say: the same three
  // characters »Im Zug« stands on, in a row of fixed height, so a screen still
  // filling in never moves the table under the Player's thumb.
  if (state === null) return { turn: "…", standing: "…", score: null };
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

/** One Seat's place in the leaderboard. */
export type RankedSeat = {
  /**
   * The Seat itself, by index. It is the row's identity — the same Seat is the
   * same row wherever it has moved to — and nothing about the order it joined
   * in is shown.
   */
  seat: number;
  name: string;
  /**
   * The number this row reads *now*, which for the half-second after a Turn is
   * banked is a count on its way somewhere and not the settled score. The rows
   * are ranked on it, so a row changes place at the moment its number crosses
   * its neighbour's.
   */
  score: number;
  /** Whether this is the Seat this device holds. */
  you: boolean;
};

/** How many rows the leaderboard is at its widest. */
const WINDOW = 3;

/**
 * Whether the screen can afford the leaderboard, which is three rows and a turn
 * line where the collapsed row is one line of both. The extra costs about 34px
 * (`--play-board` against `--play-row` in `index.css`), and the play screen's
 * spare height is what the budget has left over once `--room` stops ramping:
 * 48.7px at 844 of viewport, 37.4 at 754, 26.4 at 667, 8.5 at 553.
 *
 * So 800, measured: the worst case the play screen has — four Seats, the
 * »letzte Runde« banner up, an effect over two lines, six dice on the table and
 * six set aside — asks for 789.6px of an 800 viewport with the leaderboard in
 * it and 829.3 of 844, so it clears by 10.4 and 14.7 and does not scroll. The
 * smallest screen the app fits already runs on 8.5. Below 800 the screen keeps
 * the single row, because a leaderboard that brings back scrolling costs a
 * Player the sixth die to tell them something the tap already would.
 *
 * The height is the one the browser is offering this moment, not the phone's:
 * a 390×844 handset whose Safari has its toolbars out has around 750 of it and
 * gets the collapsed row, and gets the leaderboard when they slide away. That
 * is `--room`'s `dvh` asked in JavaScript rather than a second rule about
 * phones.
 */
export const affordsLeaderboard = (viewportHeight: number): boolean =>
  viewportHeight >= 800;

export function leaderboard(
  /** The settled position, for the reason the collapsed row reads it. */
  state: GameState,
  /** This device's Seat, or `null` for a Spectator. */
  mySeat: number | null,
  /**
   * What each Seat's score reads on screen this frame, by Seat — the counting
   * numbers while a bank is counting, and the settled ones the rest of the
   * time, which is why leaving it out means the settled ones.
   *
   * The rows are ranked on these rather than on the position behind them, and
   * that is the whole of the overtake: the row moves on the step its number
   * passes its neighbour's, so the swap is visibly caused by the count. Ranked
   * on the settled scores instead, a row would arrive in its new place while
   * the number that put it there was still climbing — the app knowing something
   * it had not shown.
   *
   * Level is not past. Two numbers equal for a step break on the Seat like any
   * other tie, so a row crossing does not flicker on the step it lands level.
   */
  shown: number[] = state.seats.map((seat) => seat.score),
): RankedSeat[] {
  const ranked = state.seats
    .map((seat, index) => ({
      seat: index,
      name: seat.name,
      score: shown[index],
      you: index === mySeat,
    }))
    // Ties break on the Seat, which is fixed for the life of the Game: two
    // Seats level on points hold their order however often this is asked, so a
    // row never swaps places because something unrelated moved.
    .sort((a, b) => b.score - a.score || a.seat - b.seat);
  const me = ranked.findIndex((row) => row.you);
  // A Spectator holds no Seat and so has no neighbours: the window starts at
  // the top, which is the part of a table anyone can read without a place in
  // it. Otherwise it is centred on this device's Seat and slides at the edges
  // rather than padding — the leader has nobody above, and shows the two below
  // instead of an empty half-board.
  const start =
    me < 0
      ? 0
      : Math.min(Math.max(me - 1, 0), Math.max(ranked.length - WINDOW, 0));
  return ranked.slice(start, start + WINDOW);
}
