import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { gameFields } from "./schema";
import {
  applyEvent,
  cardsLeft,
  CARDS,
  newGame,
  seatMayPlay,
  winners,
  type Card,
  type Deck,
  type Face,
  type GameEvent,
  type GameState,
} from "../src/game/turn";
import { turnEnding, turnStep } from "../src/game/history";
import { signedInUser } from "./users";

/**
 * Dice and Cards are drawn here and nowhere else (ADR 0001): the Roll, the
 * rules and the score all land in one transaction. These functions hold no game
 * logic — they load the Game, hand it to the reducer, and write back what comes
 * out.
 *
 * The one thing they decide for themselves is who is calling: a device proves
 * its Seat with the secret it was given when it took one (ADR 0004). Whether
 * the move is legal is the reducer's question; whether the caller is that Seat
 * is this file's, and it is a string comparison.
 */

const stateOf = (game: Doc<"games">): GameState => ({
  seats: game.seats,
  activeSeatIndex: game.activeSeatIndex,
  phase: game.phase,
  deck: game.deck,
  turn: game.turn,
});

/**
 * A reducer position as the database takes it. The one thing that has to be put
 * back is the Seat's owner: it is a `users` id in the schema and an opaque
 * string in `turn.ts`, which imports nothing and never learns what an id is.
 * Only `takeSeat` below ever puts one in, and only one it read from the token.
 */
const gameDocOf = (state: GameState, abandoned: boolean) => ({
  ...state,
  seats: state.seats.map((seat) => ({
    ...seat,
    owner: seat.owner as Id<"users"> | null,
  })),
  abandoned,
});

const rollDice = (count: number): Face[] =>
  Array.from(
    { length: count },
    () => (Math.floor(Math.random() * 6) + 1) as Face,
  );

/** One Card from what the deck still holds, each remaining copy equally likely. */
const drawCard = (deck: Deck): Card => {
  let position = Math.floor(Math.random() * cardsLeft(deck));
  for (const card of CARDS) {
    position -= deck[card];
    if (position < 0) return card;
  }
  throw new Error("The deck is empty");
};

/** The Turn being played, if one is: the newest record still without an ending. */
async function openTurn(ctx: MutationCtx, gameId: Id<"games">) {
  const latest = await ctx.db
    .query("turns")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .order("desc")
    .first();
  return latest !== null && latest.ending === null ? latest : null;
}

const startTurn = async (
  ctx: MutationCtx,
  gameId: Id<"games">,
  seatIndex: number,
) =>
  await ctx.db.insert("turns", {
    gameId,
    seatIndex,
    steps: [],
    ending: null,
    score: 0,
  });

/**
 * History as it happens. A Turn's record is written move by move because a
 * later position cannot say what the dice were — and it is written to `turns`
 * rather than onto the Game, which every device re-reads on every change.
 */
async function record(
  ctx: MutationCtx,
  gameId: Id<"games">,
  before: GameState,
  event: GameEvent,
  after: GameState,
) {
  const open = await openTurn(ctx, gameId);
  if (open !== null) {
    const step = turnStep(before, event, after);
    const ending = turnEnding(after.turn);
    const seat = before.activeSeatIndex;
    await ctx.db.patch("turns", open._id, {
      steps: step === null ? open.steps : [...open.steps, step],
      ending,
      score:
        ending === null
          ? open.score
          : after.seats[seat].score - before.seats[seat].score,
    });
  }
  // A Game that ends on a level Final round leaves its last Turn on the table
  // and starts no new one.
  if (event.type === "nextTurn" && after.turn.phase === "awaitingCard") {
    await startTurn(ctx, gameId, after.activeSeatIndex);
  }
}

async function load(ctx: MutationCtx, gameId: Id<"games">) {
  const game = await ctx.db.get("games", gameId);
  if (game === null) throw new Error("No such Game");
  return game;
}

/**
 * The Seat a device's secret proves it holds in this Game, or `null` for a
 * device holding none — somebody who has not taken a Seat, or a Spectator.
 */
async function seatOf(
  ctx: QueryCtx,
  gameId: Id<"games">,
  secret: string,
): Promise<number | null> {
  const held = await ctx.db
    .query("seatSecrets")
    .withIndex("by_game_and_secret", (q) =>
      q.eq("gameId", gameId).eq("secret", secret),
    )
    .unique();
  return held === null ? null : held.seatIndex;
}

/** The Seat this secret proves, refusing a device that holds none. */
export async function requireSeat(
  ctx: MutationCtx,
  gameId: Id<"games">,
  secret: string,
): Promise<number> {
  const seat = await seatOf(ctx, gameId, secret);
  if (seat === null) throw new Error("This device holds no Seat in this Game");
  return seat;
}

/**
 * A lobby move — taking a Seat, or starting the Game. No Turn is running, so
 * there is nothing to record; the reducer refuses either one once the Game has
 * started.
 */
async function lobbyMove(
  ctx: MutationCtx,
  gameId: Id<"games">,
  event: GameEvent,
): Promise<GameState> {
  const game = await load(ctx, gameId);
  const after = applyEvent(stateOf(game), event);
  // The reducer knows nothing of abandoning, so that flag is carried across.
  await ctx.db.replace("games", gameId, gameDocOf(after, game.abandoned));
  return after;
}

/** One move of a Turn, by the Seat whose Turn it is and by nobody else. */
async function play(
  ctx: MutationCtx,
  gameId: Id<"games">,
  secret: string,
  event: (state: GameState) => GameEvent,
) {
  const seat = await requireSeat(ctx, gameId, secret);
  const game = await load(ctx, gameId);
  const before = stateOf(game);
  if (!seatMayPlay(before, seat)) throw new Error("It is not this Seat's Turn");
  const move = event(before);
  const after = applyEvent(before, move);
  await ctx.db.replace("games", gameId, gameDocOf(after, game.abandoned));
  await record(ctx, gameId, before, move, after);
  return null;
}

/** A new Game is an empty lobby: no Seats, and no Turn until it is started. */
export const create = mutation({
  args: {},
  returns: v.id("games"),
  handler: async (ctx) =>
    await ctx.db.insert("games", gameDocOf(newGame(), false)),
});

/**
 * Taking a Seat in the lobby, which anyone holding the link may do — the link
 * grants no Seat by itself (ADR 0004). The rules of who may are the reducer's;
 * what comes back is this device's proof of the Seat, and the only one there
 * will ever be. A signed-in Player gets one of those too: the account is
 * something a Seat has, not something it is taken with.
 */
export const takeSeat = mutation({
  args: {
    gameId: v.id("games"),
    /**
     * What a guest typed. Ignored for a signed-in Player, whose Seat is taken
     * under their profile name — a name shown to the whole table is the
     * server's to say, not the caller's.
     */
    name: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await signedInUser(ctx);
    const after = await lobbyMove(ctx, args.gameId, {
      type: "takeSeat",
      name: user === null ? (args.name ?? "") : user.name,
      owner: user === null ? null : user.id,
    });
    const secret = crypto.randomUUID();
    await ctx.db.insert("seatSecrets", {
      gameId: args.gameId,
      // Seats are only ever appended, so the new one is the last of them.
      seatIndex: after.seats.length - 1,
      secret,
    });
    return secret;
  },
});

/**
 * Signing up or in, on a device that has been playing as a guest: every Seat it
 * holds a secret for and that nobody owns becomes this User's, in the Games
 * already finished and the ones still running.
 *
 * Nothing is backfilled, because nothing is stored — whatever is derived from
 * Seat ownership simply starts counting those Games.
 *
 * Only the Seats are written, and only their owner and name. A Game mid-Turn
 * keeps whose Turn it is, its scores and its dice: none of that is this
 * mutation's, and the reducer is not asked.
 */
export const claimSeats = mutation({
  args: {
    /** What the device holds, straight out of storage: ids may be nonsense. */
    held: v.array(v.object({ gameId: v.string(), secret: v.string() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await signedInUser(ctx);
    if (user === null) return null;
    for (const { gameId: id, secret } of args.held) {
      const gameId = ctx.db.normalizeId("games", id);
      if (gameId === null) continue;
      const seatIndex = await seatOf(ctx, gameId, secret);
      if (seatIndex === null) continue;
      const game = await ctx.db.get("games", gameId);
      // A Seat somebody already owns is never taken over, and a secret may
      // outlive the Seat it was minted for.
      if (game === null || game.seats[seatIndex]?.owner !== null) continue;
      await ctx.db.patch("games", gameId, {
        seats: game.seats.map((seat, index) =>
          index === seatIndex
            ? { ...seat, owner: user.id, name: user.name }
            : seat,
        ),
      });
    }
    return null;
  },
});

/**
 * »Los geht's«: the Seats are fixed, and the first of them is up. Starting is a
 * Player's move, so it takes a Seat at this table — not merely the link.
 */
export const start = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSeat(ctx, args.gameId, args.secret);
    await lobbyMove(ctx, args.gameId, { type: "start" });
    await startTurn(ctx, args.gameId, 0);
    return null;
  },
});

const gameDoc = {
  _id: v.id("games"),
  _creationTime: v.number(),
  ...gameFields,
  abandoned: v.boolean(),
};

/**
 * A Game by its id. The id comes out of the address bar, so it is a plain
 * string that may be nonsense — an unreadable one is simply a Game that is not
 * there.
 */
export const get = query({
  args: { gameId: v.string() },
  returns: v.union(v.null(), v.object(gameDoc)),
  handler: async (ctx, args) => {
    const gameId = ctx.db.normalizeId("games", args.gameId);
    return gameId === null ? null : await ctx.db.get("games", gameId);
  },
});

/**
 * Which Seat this device holds in a Game, or `null` for none: it has not taken
 * one, or it is watching a Game that started without it. The secret comes
 * straight out of storage, so it may be a Seat that no longer exists.
 */
export const heldSeat = query({
  args: { gameId: v.string(), secret: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    const gameId = ctx.db.normalizeId("games", args.gameId);
    return gameId === null ? null : await seatOf(ctx, gameId, args.secret);
  },
});

/** How many of a device's Games the start screen will show. */
const LIST_LIMIT = 50;

/**
 * The Games a device asks for by id, newest first. Scoping is the caller's
 * list: there is no query that hands out Games it did not already know about.
 */
export const list = query({
  args: { gameIds: v.array(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("games"),
      _creationTime: v.number(),
      seats: gameFields.seats,
      phase: gameFields.phase,
      abandoned: v.boolean(),
      /** Empty until the Game is over, and for an abandoned Game always. */
      winners: v.array(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const ids = args.gameIds
      .map((id) => ctx.db.normalizeId("games", id))
      .filter((id) => id !== null)
      .slice(-LIST_LIMIT);
    const games = await Promise.all(ids.map((id) => ctx.db.get("games", id)));
    return games
      .filter((game) => game !== null)
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((game) => ({
        _id: game._id,
        _creationTime: game._creationTime,
        seats: game.seats,
        phase: game.phase,
        abandoned: game.abandoned,
        winners:
          game.phase === "over" && !game.abandoned
            ? winners(stateOf(game))
            : [],
      }));
  },
});

/**
 * Walking away: the scores stand, nobody won, and the Turn in progress is
 * recorded as the abandoned one it was.
 */
export const abandon = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Ending the Game for everybody is a Player's move, so it takes a Seat.
    await requireSeat(ctx, args.gameId, args.secret);
    const game = await load(ctx, args.gameId);
    if (game.phase === "over") throw new Error("The Game is already over");
    const open = await openTurn(ctx, args.gameId);
    if (open !== null) {
      await ctx.db.patch("turns", open._id, { ending: "abandoned" });
    }
    await ctx.db.patch("games", args.gameId, {
      phase: "over",
      abandoned: true,
    });
    return null;
  },
});

export const draw = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, args.secret, (state) => ({
      type: "draw",
      card: drawCard(state.deck),
    })),
});

export const roll = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, args.secret, (state) => ({
      type: "roll",
      faces: rollDice(state.turn.diceInHand),
    })),
});

export const setAside = mutation({
  args: {
    gameId: v.id("games"),
    secret: v.string(),
    dice: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, args.secret, () => ({
      type: "setAside",
      dice: args.dice,
    })),
});

export const stop = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, args.secret, () => ({ type: "stop" })),
});

export const nextTurn = mutation({
  args: { gameId: v.id("games"), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, args.secret, () => ({ type: "nextTurn" })),
});
