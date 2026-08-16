import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { winners } from "../src/game/turn";
import { countsForStats, statsFor, type StatsGame } from "../src/game/stats";
import { signedInUser } from "./users";

/**
 * What an account is finally worth: your best Turn ever, and your record
 * against everyone you have played. Nothing here is stored — it is derived from
 * the finished Games themselves every time it is asked for (see
 * `src/game/stats.ts`), so there is no counter that can drift and no backfill
 * when a guest's Seat is claimed.
 */

/**
 * How far back a Player's record reaches.
 *
 * A Seat's owner lives inside the Game's `seats` array, and an array field
 * cannot be indexed, so the Games a User sat in are found by reading the recent
 * ones and keeping the Games with their Seat in.
 *
 * TODO: the ceiling is this many Games in the whole deployment — and reading
 * them all also means this query reruns whenever any Game anywhere changes.
 * Past that, a `seatOwners` row written when a Seat is taken or claimed,
 * indexed by User, which makes both problems go away.
 */
const GAME_LIMIT = 500;

/** The best Turn this Seat played in this Game, or `null` if it played none. */
async function bestTurn(
  ctx: QueryCtx,
  gameId: Id<"games">,
  seatIndex: number,
): Promise<{ seatIndex: number; score: number } | null> {
  const best = await ctx.db
    .query("turns")
    .withIndex("by_game_and_seat_and_score", (q) =>
      q.eq("gameId", gameId).eq("seatIndex", seatIndex),
    )
    .order("desc")
    .first();
  return best === null ? null : { seatIndex, score: best.score };
}

/** A finished Game as the derivation takes it, with this User's best Turn in it. */
async function statsGame(
  ctx: QueryCtx,
  game: Doc<"games">,
  user: Id<"users">,
): Promise<StatsGame> {
  const mine = game.seats.flatMap((seat, index) =>
    seat.owner === user ? [index] : [],
  );
  const turns = await Promise.all(
    mine.map((seatIndex) => bestTurn(ctx, game._id, seatIndex)),
  );
  return {
    seats: game.seats,
    phase: game.phase,
    abandoned: game.abandoned,
    // Who won is the reducer's answer, not this file's.
    winners: winners(game),
    turns: turns.filter((turn) => turn !== null),
  };
}

/**
 * The signed-in Player's record, or `null` for a guest — who has no record to
 * show and is told on screen what one would be.
 */
export const mine = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      bestTurn: v.union(v.number(), v.null()),
      opponents: v.array(
        v.object({
          id: v.id("users"),
          name: v.string(),
          games: v.number(),
          wins: v.number(),
          losses: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const user = await signedInUser(ctx);
    if (user === null) return null;

    const recent = await ctx.db.query("games").order("desc").take(GAME_LIMIT);
    const played = recent.filter(
      (game) =>
        countsForStats(game) &&
        game.seats.some((seat) => seat.owner === user.id),
    );
    const games = await Promise.all(
      played.map((game) => statsGame(ctx, game, user.id)),
    );

    const stats = statsFor(user.id, games);
    return {
      bestTurn: stats.bestTurn,
      opponents: await Promise.all(
        stats.opponents.map(async (record) => {
          // The derivation sees an opaque string, the way the reducer does;
          // the id is put back on here, where ids are known about.
          const id = record.opponent as Id<"users">;
          const opponent = await ctx.db.get("users", id);
          return {
            id,
            name: opponent?.name ?? "",
            games: record.games,
            wins: record.wins,
            losses: record.losses,
          };
        }),
      ),
    };
  },
});
