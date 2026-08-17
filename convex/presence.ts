import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireSeat } from "./games";

/**
 * What a Seat's own device is saying about itself: that it is still here, and
 * which dice its Player has picked up. One row per Seat, rewritten as either
 * changes.
 *
 * Nothing here touches the Game document. That is the whole point of the
 * separate table: every device at the table subscribes to the Game, and state
 * written there would re-render every phone several times a minute — for a
 * heartbeat, and once per tap for a selection — for news that is not a move.
 * None of it is a fact about the Game either: `src/game/turn.ts` never hears
 * about any of it, and no move is decided from it.
 *
 * A device proves the Seat is its own the way it proves a move — with the
 * secret it was given when it took the Seat (ADR 0004). So a guest is tracked
 * exactly like an account, and a Spectator, holding no secret, publishes
 * nothing.
 *
 * The presence half of this table is a deliberate departure from the
 * `@convex-dev/presence` component the Convex guidelines call for, argued out
 * in ADR 0006 — read it before reopening the question.
 */

/**
 * How many rows a Game can have: one per Seat, and Seats are fixed at the
 * start. Generous enough that no real table hits it, bounded so the query
 * cannot grow without limit.
 */
const MAX_SEATS = 32;

/** A Roll is six dice at the most, so a choice within it is six numbers at most. */
const MAX_DICE = 6;

/** Which dice of a Roll a Player has picked up. */
type Selection = { roll: string; dice: number[] };

/**
 * A Seat's row, made if it is not there yet — the one place this table is
 * written, whatever is being said.
 *
 * `selection` of `null` is a plain check-in and leaves whatever is on the row
 * alone: presence and a selection change on their own schedules, and neither
 * writer has anything to say about the other's field.
 */
async function record(
  ctx: MutationCtx,
  gameId: Id<"games">,
  secret: string,
  selection: Selection | null,
): Promise<null> {
  const seatIndex = await requireSeat(ctx, gameId, secret);
  const seen = await ctx.db
    .query("presence")
    .withIndex("by_game_and_seat", (q) =>
      q.eq("gameId", gameId).eq("seatIndex", seatIndex),
    )
    .unique();
  const lastSeen = Date.now();
  // A device that is publishing anything is plainly still here, so every write
  // is a check-in too and the Player choosing never blinks out of the table.
  const fields = selection === null ? { lastSeen } : { lastSeen, selection };
  if (seen === null) {
    await ctx.db.insert("presence", { gameId, seatIndex, ...fields });
  } else {
    await ctx.db.patch("presence", seen._id, fields);
  }
  return null;
}

/** "Still here", from the device holding that Seat and from nobody else. */
export const checkIn = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
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
    const game = await ctx.db.get("games", args.gameId);
    // A Game that is over or abandoned has nobody to wait for, so there is
    // nothing to record — and no way for a stale tab to keep writing to it.
    if (game === null || game.phase === "over") return null;
    return await record(ctx, args.gameId, args.secret, null);
  },
});

/**
 * "These are the dice I have picked up", from the device holding that Seat and
 * from nobody else. Sent while a Player is choosing, a few times a second at
 * the most, and read by every other phone at the table.
 *
 * Unlike the heartbeat this deliberately does **not** read the Game, on either
 * count. Whether it is really this Seat's Turn is not checked, because asking
 * would put the Game in the read set of a write that happens every 150ms while
 * a Player is choosing — and the very next thing that Player does is a move
 * that writes it. That is a conflict on the one path that has to stay quick,
 * bought for nothing: a selection published out of Turn is refused on arrival
 * by `src/selection.ts`, which draws a row only for the Seat on the table and
 * only while its Roll is still the Roll in play.
 */
export const publishSelection = mutation({
  args: {
    gameId: v.id("games"),
    secret: v.string(),
    /** The Roll it was made in, as its faces in order. */
    roll: v.string(),
    dice: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // A Roll is six dice. Nothing legitimate sends more, and this is a public
    // mutation, so the size of what one seated device can put on everybody
    // else's screen is bounded here rather than trusted.
    if (args.roll.length > MAX_DICE || args.dice.length > MAX_DICE) {
      throw new Error("A Roll is six dice at the most");
    }
    return await record(ctx, args.gameId, args.secret, {
      roll: args.roll,
      dice: args.dice,
    });
  },
});

/**
 * Every Seat's row in a Game, raw. Nothing is decided here.
 *
 * Present-or-away is not, because a query that read the clock would not be
 * re-run as time passed, so it would go stale exactly when a Seat went quiet —
 * which is the one case that matters. The client holds the clock and this query
 * holds the facts.
 *
 * Nor is which selection may be drawn: a row from a Seat whose Turn has passed,
 * or from a Roll that has been rolled away, is left here and simply not shown
 * (`src/selection.ts`). Both halves follow the same rule — this table reports,
 * the client decides.
 *
 * Everyone at the table may read it, Spectators included: the scoreboard they
 * are watching is a Player's scoreboard, and so is the Roll.
 */
export const forGame = query({
  args: { gameId: v.id("games") },
  returns: v.array(
    v.object({
      seatIndex: v.number(),
      lastSeen: v.number(),
      selection: v.optional(
        v.object({ roll: v.string(), dice: v.array(v.number()) }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_game_and_seat", (q) => q.eq("gameId", args.gameId))
      .take(MAX_SEATS);
    return rows.map(({ seatIndex, lastSeen, selection }) => ({
      seatIndex,
      lastSeen,
      selection,
    }));
  },
});
