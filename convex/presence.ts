import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireSeat } from "./games";

/**
 * What a Seat's own device is saying about itself: that it is still here, that
 * a thumb is on »Würfeln«, and which dice its Player has picked up. One row per
 * Seat, rewritten as any of them changes.
 *
 * Nothing here touches the Game document. That is the whole point of the
 * separate table: every device at the table subscribes to the Game, and state
 * written there would re-render every phone several times a minute — for a
 * heartbeat, once a hold for a wind-up, and once per tap for a selection — for
 * news that is not a move.
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

/**
 * How long a Roll key may be. It is six faces and three numbers of the position
 * around them (`src/selection.ts`), which on the largest Game this app can play
 * is about twenty characters; the rest is slack so that a longer Game never
 * silently stops publishing. It is here for the reason `MAX_DICE` is — the
 * string goes on everybody else's screen, so its size is bounded rather than
 * trusted — and not because anything reads it apart.
 */
const MAX_ROLL_KEY = 32;

/** Which dice of a Roll a Player has picked up. */
type Selection = { roll: string; dice: number[] };

/** What one write says about its Seat. A field left out keeps what it said. */
type Says = {
  /** The moment »Würfeln« went down, or `undefined` to say the hold is over. */
  rollingSince?: number | undefined;
  selection?: Selection;
};

/**
 * A Seat's row, made if it is not there yet — the one place this table is
 * written, whatever is being said.
 *
 * Every write is a check-in as well: a device saying anything at all is plainly
 * still here, so the Player winding up or choosing never blinks out of the
 * table. Past that, each writer names only its own field and a field left
 * unnamed keeps whatever it said before — presence, a wind-up and a selection
 * change on their own schedules, and no writer has anything to say about
 * another's field.
 *
 * The caller has proved the Seat is its own before calling. Whether the Game is
 * still running is asked here, once, for all three of them — a Game that is over
 * or abandoned has nobody to wait for, nothing to say about a Roll and no
 * screen showing either, so nothing about a Seat is recorded against it. One
 * guard in the one place this table is written, so a stale tab or a
 * hand-written client cannot keep a dead Game's row fresh through whichever
 * writer was left open, and a fourth writer cannot be added without it.
 *
 * That read is the one coupling this table does not otherwise have, and it is a
 * known trade rather than an oversight. It writes nothing to the Game document,
 * but it puts it in the read set of every write here — a heartbeat per Seat
 * every ten seconds, twice a wind-up, and a selection every 150ms while a
 * Player is choosing, whose very next act is a move that writes that same
 * document. So these can conflict with a move landing mid-flight and Convex
 * retries them. Accepted because a retry costs a Player nothing: none of these
 * writes is rendered from, nothing waits on one, and the client says all of it
 * again shortly. The alternative is presence rows that outlive the Game they
 * belong to and a public mutation that will write to a Game that is over. If
 * this ever shows up as contention, the fix is to stop asking and let a
 * finished Game go on taking writes that no screen reads — the rows are already
 * there and no new one is made.
 */
async function said(
  ctx: MutationCtx,
  gameId: Id<"games">,
  seatIndex: number,
  says: Says,
): Promise<null> {
  const game = await ctx.db.get("games", gameId);
  if (game === null || game.phase === "over") return null;
  const seen = await ctx.db
    .query("presence")
    .withIndex("by_game_and_seat", (q) =>
      q.eq("gameId", gameId).eq("seatIndex", seatIndex),
    )
    .unique();
  // `rollingSince` is the moment of the press: it is written once, when the
  // thumb goes down, and is not written again while it is down. The watching
  // table turns its dice from it, so a second write during the hold would
  // refresh nothing — it would move the start of the wind-up forward and snap
  // every other phone's dice back to where a hold that had just begun points.
  //
  // The end of one is sent too, rather than left to go stale, and it is sent
  // once the Roll it was winding up for has landed. That order is the whole
  // point: cleared on release, a watching phone would stop the dice a round
  // trip before the real ones arrived and show a still table in between —
  // which is the gap the wind-up exists to cover. The threshold in
  // `src/presence.ts` is then only ever reached by a hold nobody ended, a
  // phone that locked or closed mid-wind-up, which is what a threshold is for.
  const row = { lastSeen: Date.now(), ...says };
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
  handler: async (ctx, args) => {
    const seatIndex = await requireSeat(ctx, args.gameId, args.secret);
    // A finished Game is skipped by `said`, along with everything else this
    // table writes.
    return await said(ctx, args.gameId, seatIndex, {});
  },
});

/**
 * "Still here, and winding up to roll" — or, once the Roll has landed, that the
 * winding up is over. Sent twice for a hold and no more: when »Würfeln« goes
 * down, and again when the dice are on the table, so the rest of the table sees
 * them turning rather than a screen gone quiet for ten seconds. Nothing is sent
 * in between, because the row already says when the press was and repeating
 * that is the one thing that would spoil it.
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
  handler: async (ctx, args) => {
    const seatIndex = await requireSeat(ctx, args.gameId, args.secret);
    // This one reads the Game for itself as well as through `said`, because it
    // is the only writer here that wants something out of the document rather
    // than only the fact that it is still being played. Two reads of one
    // document in one transaction, which is one read set either way.
    const game = await ctx.db.get("games", args.gameId);
    // Only the Seat whose Turn it is can be winding up to roll, and a Seat that
    // cannot roll must not be able to set the table's dice turning. The client
    // asks only on its own Turn; this is what makes that true rather than
    // customary. Not an error — it is decoration, and refusing it loudly would
    // put »Das hat nicht geklappt« on a screen where nothing was attempted.
    const holding = args.holding && game?.activeSeatIndex === seatIndex;
    return await said(ctx, args.gameId, seatIndex, {
      rollingSince: holding ? Date.now() : undefined,
    });
  },
});

/**
 * "These are the dice I have picked up", from the device holding that Seat and
 * from nobody else. Sent while a Player is choosing, a few times a second at
 * the most, and read by every other phone at the table.
 *
 * Whether it is really this Seat's Turn is deliberately **not** checked. Asking
 * would put the Game's live position in the read set of a write that happens
 * every 150ms while a Player is choosing — and the very next thing that Player
 * does is a move that writes it. That is a conflict on the one path that has to
 * stay quick, bought for nothing: a selection published out of Turn is refused
 * on arrival by `src/selection.ts`, which draws a row only for the Seat on the
 * table and only while its Roll is still the Roll in play.
 *
 * A finished Game is a different matter, and `said` refuses one for this writer
 * as it does for the other two. Nothing in the app can reach this once the Game
 * is over — the Result screen has replaced the table — but it is a public
 * mutation behind nothing but a Seat's secret, and a stale tab or a
 * hand-written client that could still write here would keep a dead Game's row
 * fresh for ever, which is the thing that read is there to prevent.
 */
export const publishSelection = mutation({
  args: {
    gameId: v.id("games"),
    secret: v.string(),
    /** The Roll it was made in, as `src/selection.ts` names it. */
    roll: v.string(),
    dice: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Who is asking, before what they are asking for: an unseated caller is
    // told that and not told the shape of a Roll key first.
    const seatIndex = await requireSeat(ctx, args.gameId, args.secret);
    // Nothing legitimate sends more, and this is a public mutation, so the size
    // of what one seated device can put on everybody else's screen is bounded
    // here rather than trusted.
    if (args.roll.length > MAX_ROLL_KEY || args.dice.length > MAX_DICE) {
      throw new Error("A Roll is six dice at the most");
    }
    return await said(ctx, args.gameId, seatIndex, {
      selection: { roll: args.roll, dice: args.dice },
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
      rollingSince: v.optional(v.number()),
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
    return rows.map(({ seatIndex, lastSeen, rollingSince, selection }) => ({
      seatIndex,
      lastSeen,
      rollingSince,
      selection,
    }));
  },
});
