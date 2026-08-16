import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSeat } from "./games";

/**
 * Who still has the Game open. A seated device checks in every few seconds
 * while its tab is visible, and `src/presence.ts` turns those check-ins into
 * present-or-away on the client.
 *
 * Nothing here touches the Game document. That is the whole point of the
 * separate table: every device at the table subscribes to the Game, and a
 * heartbeat written there would re-render every phone several times a minute
 * for news that is not a move.
 *
 * A device proves the Seat is its own the way it proves a move — with the
 * secret it was given when it took the Seat (ADR 0004). Presence is per Seat,
 * so a guest is tracked exactly like an account, and a Spectator, holding no
 * secret, is not tracked at all.
 */

/**
 * How many check-ins a Game can have: one per Seat, and Seats are fixed at the
 * start. Generous enough that no real table hits it, bounded so the query
 * cannot grow without limit.
 */
const MAX_SEATS = 32;

/** "Still here", from the device holding that Seat and from nobody else. */
export const checkIn = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const seatIndex = await requireSeat(ctx, args.gameId, args.secret);
    const game = await ctx.db.get("games", args.gameId);
    // A Game that is over or abandoned has nobody to wait for, so there is
    // nothing to record — and no way for a stale tab to keep writing to it.
    if (game === null || game.phase === "over") return null;
    const seen = await ctx.db
      .query("presence")
      .withIndex("by_game_and_seat", (q) =>
        q.eq("gameId", args.gameId).eq("seatIndex", seatIndex),
      )
      .unique();
    const lastSeen = Date.now();
    if (seen === null) {
      await ctx.db.insert("presence", {
        gameId: args.gameId,
        seatIndex,
        lastSeen,
      });
    } else {
      await ctx.db.patch("presence", seen._id, { lastSeen });
    }
    return null;
  },
});

/**
 * Every check-in in a Game, raw. Present-or-away is not decided here: a query
 * that read the clock would not be re-run as time passed, so it would go stale
 * exactly when a Seat went quiet — which is the one case that matters. The
 * client holds the clock and this query holds the facts.
 *
 * Everyone at the table may read it, Spectators included: the scoreboard they
 * are watching is a Player's scoreboard.
 */
export const forGame = query({
  args: { gameId: v.id("games") },
  returns: v.array(v.object({ seatIndex: v.number(), lastSeen: v.number() })),
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("presence")
      .withIndex("by_game_and_seat", (q) => q.eq("gameId", args.gameId))
      .take(MAX_SEATS);
    return seen.map(({ seatIndex, lastSeen }) => ({ seatIndex, lastSeen }));
  },
});
