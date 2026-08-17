import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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
 *
 * This table is a deliberate departure from the `@convex-dev/presence`
 * component the Convex guidelines call for, argued out in ADR 0006 — read it
 * before reopening the question.
 */

/**
 * How many check-ins a Game can have: one per Seat, and Seats are fixed at the
 * start. Generous enough that no real table hits it, bounded so the query
 * cannot grow without limit.
 */
const MAX_SEATS = 32;

/**
 * One Seat's row, written from the device that holds that Seat and no other.
 *
 * `winding` says whether the Player has »Würfeln« held down — `null` for a
 * check-in, which is not about the button at all and leaves whatever it says
 * alone. It comes through here rather than through a table of its own because a
 * thumb on the button is proof of presence too: the same row, the same write,
 * and no second heartbeat running beside the first while a Player winds up.
 */
async function said(
  ctx: MutationCtx,
  gameId: Id<"games">,
  secret: string,
  winding: boolean | null,
): Promise<null> {
  const seatIndex = await requireSeat(ctx, gameId, secret);
  // Reading the Game here is the one coupling this table does not otherwise
  // have, and it is a known trade rather than an oversight. It writes nothing
  // to that document, but the read puts it in every heartbeat's read set — a
  // Seat every ten seconds, times the Seats at the table — so a heartbeat and
  // a move that lands mid-flight can conflict, and Convex retries the
  // heartbeat. Accepted because a retried heartbeat costs a Player nothing:
  // it writes a timestamp nobody is waiting on, and the client asks again in
  // ten seconds anyway. The alternative is a presence row that outlives the
  // Game it belongs to. If this ever shows up as contention, the fix is to
  // stop asking and let a finished Game go on taking check-ins that nobody
  // reads — the row is already there and no new one is made.
  const game = await ctx.db.get("games", gameId);
  // A Game that is over or abandoned has nobody to wait for, so there is
  // nothing to record — and no way for a stale tab to keep writing to it.
  if (game === null || game.phase === "over") return null;
  const now = Date.now();
  // Only the Seat whose Turn it is can be winding up to roll, and a Seat that
  // cannot roll must not be able to set the table's dice turning. The client
  // asks only on its own Turn; this is what makes that true rather than
  // customary. Not an error — it is decoration, and refusing it loudly would
  // put »Das hat nicht geklappt« on a screen where nothing was attempted.
  const holding = winding === true && game.activeSeatIndex === seatIndex;
  const seen = await ctx.db
    .query("presence")
    .withIndex("by_game_and_seat", (q) =>
      q.eq("gameId", gameId).eq("seatIndex", seatIndex),
    )
    .unique();
  // A hold is a thumb on the screen, so it is a check-in as well.
  //
  // The end of one is sent too, rather than left to go stale, and it is sent
  // once the Roll it was winding up for has landed. That order is the whole
  // point: cleared on release, a watching phone would stop the dice a round
  // trip before the real ones arrived and show a still table in between —
  // which is the gap the wind-up exists to cover. The threshold in
  // `src/presence.ts` is then only ever reached by a hold nobody ended, a
  // phone that locked or closed mid-wind-up, which is what a threshold is for.
  const row =
    winding === null
      ? { lastSeen: now }
      : { lastSeen: now, rollingSince: holding ? now : undefined };
  if (seen === null) {
    await ctx.db.insert("presence", { gameId, seatIndex, ...row });
  } else {
    await ctx.db.patch("presence", seen._id, row);
  }
  return null;
}

/** "Still here", from the device holding that Seat and from nobody else. */
export const checkIn = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => await said(ctx, args.gameId, args.secret, null),
});

/**
 * "Still here, and winding up to roll" — or, once the Roll has landed, that the
 * winding up is over. Sent when »Würfeln« goes down, again every few seconds
 * while it is held, and a last time when the dice are on the table, so the rest
 * of the table sees them turning rather than a screen gone quiet for ten
 * seconds.
 *
 * Nothing is decided by it and nothing waits on it. The Roll itself is a
 * separate mutation sent on release, which is where the faces are chosen and
 * from the same source they always were (ADR 0001) — this says only that a
 * thumb is down, and it does not say for how long, because how long changes
 * nothing.
 */
export const winding = mutation({
  args: {
    gameId: v.id("games"),
    secret: v.string(),
    /** Whether the thumb is still down. Never how long it has been down. */
    holding: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) =>
    await said(ctx, args.gameId, args.secret, args.holding),
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
  returns: v.array(
    v.object({
      seatIndex: v.number(),
      lastSeen: v.number(),
      rollingSince: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("presence")
      .withIndex("by_game_and_seat", (q) => q.eq("gameId", args.gameId))
      .take(MAX_SEATS);
    return seen.map(({ seatIndex, lastSeen, rollingSince }) => ({
      seatIndex,
      lastSeen,
      rollingSince,
    }));
  },
});
