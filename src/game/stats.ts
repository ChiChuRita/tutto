import type { GamePhase } from "./turn";

/**
 * Head-to-head, derived from the Games themselves. Nothing is stored and no
 * counter is kept: a Seat claimed by a User months later starts counting the
 * moment it is claimed, with nothing to backfill.
 *
 * Like `history.ts` this holds no rules of its own beyond what the glossary
 * says a record is — who won is the reducer's answer, handed in.
 */

/** A Seat as head-to-head sees it: whose it is, and nothing else. */
export type StatsSeat = { owner: string | null };

/** A Turn as head-to-head sees it: whose Seat played it, and what it was worth. */
export type StatsTurn = { seatIndex: number; score: number };

export type StatsGame = {
  seats: StatsSeat[];
  phase: GamePhase;
  /** Ended by a Player rather than by a win: scores, but no winner. */
  abandoned: boolean;
  /** The Seats that won, from the reducer's `winners`. Several when tied. */
  winners: number[];
  /** The Turns of this Game worth weighing for a best Turn. */
  turns: StatsTurn[];
};

/** One User's record against one other. */
export type OpponentRecord = {
  opponent: string;
  games: number;
  wins: number;
  losses: number;
};

export type Stats = {
  /** The best single Turn this User has ever had, or `null` for none yet. */
  bestTurn: number | null;
  /** Every User this one has finished a Game with, most played first. */
  opponents: OpponentRecord[];
};

/**
 * Whether a Game says anything about anyone's record. An abandoned Game has
 * final scores but no winner, so walking away from a stalled Game must not
 * count as a loss — and an unfinished one has not happened yet.
 *
 * Exported so the caller can read only the Games this counts, rather than
 * keeping a second copy of the rule.
 */
export const countsForStats = (game: {
  phase: GamePhase;
  abandoned: boolean;
}): boolean => game.phase === "over" && !game.abandoned;

/**
 * What these Games say about one User. "Your opponents" is not a list anyone
 * keeps: it is exactly the set of Users a finished Game has been shared with,
 * so a guest's Seat contributes nothing — there is nobody to record against.
 */
export function statsFor(user: string, games: StatsGame[]): Stats {
  let bestTurn: number | null = null;
  const records = new Map<string, OpponentRecord>();

  for (const game of games) {
    if (!countsForStats(game)) continue;
    const mine = game.seats.flatMap((seat, index) =>
      seat.owner === user ? [index] : [],
    );
    if (mine.length === 0) continue;

    for (const turn of game.turns) {
      if (!mine.includes(turn.seatIndex)) continue;
      if (bestTurn === null || turn.score > bestTurn) bestTurn = turn.score;
    }

    const won = (seats: number[]) =>
      seats.some((index) => game.winners.includes(index));
    const iWon = won(mine);

    for (const opponent of new Set(
      game.seats.flatMap((seat, index) =>
        seat.owner !== null && !mine.includes(index) ? [seat.owner] : [],
      ),
    )) {
      const theyWon = won(
        game.seats.flatMap((seat, index) =>
          seat.owner === opponent ? [index] : [],
        ),
      );
      const record = records.get(opponent) ?? {
        opponent,
        games: 0,
        wins: 0,
        losses: 0,
      };
      records.set(opponent, {
        ...record,
        games: record.games + 1,
        // A Game won by more than one Seat is neither: both were on top, so
        // neither beat the other.
        wins: record.wins + (iWon && !theyWon ? 1 : 0),
        losses: record.losses + (theyWon && !iWon ? 1 : 0),
      });
    }
  }

  return {
    bestTurn,
    // The people you play most are the people you argue with most, so they go
    // at the top.
    opponents: [...records.values()].sort(
      (a, b) =>
        b.games - a.games ||
        b.wins - a.wins ||
        a.opponent.localeCompare(b.opponent),
    ),
  };
}
