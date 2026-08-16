import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { gameFields } from "./schema";
import {
  applyEvent,
  cardsLeft,
  CARDS,
  newGame,
  winners,
  type Card,
  type Deck,
  type Face,
  type GameEvent,
  type GameState,
} from "../src/game/turn";
import { turnEnding, turnStep } from "../src/game/history";

/**
 * Dice and Cards are drawn here and nowhere else (ADR 0001): the Roll, the
 * rules and the score all land in one transaction. These functions hold no game
 * logic — they load the Game, hand it to the reducer, and write back what comes
 * out.
 */

const stateOf = (game: Doc<"games">): GameState => ({
  seats: game.seats,
  activeSeatIndex: game.activeSeatIndex,
  phase: game.phase,
  deck: game.deck,
  turn: game.turn,
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

async function play(
  ctx: MutationCtx,
  gameId: Id<"games">,
  event: (state: GameState) => GameEvent,
) {
  const game = await ctx.db.get("games", gameId);
  if (game === null) throw new Error("No such Game");
  const before = stateOf(game);
  const move = event(before);
  const after = applyEvent(before, move);
  // The reducer knows nothing of abandoning, so that flag is carried across.
  await ctx.db.replace("games", gameId, {
    ...after,
    abandoned: game.abandoned,
  });
  await record(ctx, gameId, before, move, after);
  return null;
}

/** A new Game is an empty lobby: no Seats, and no Turn until it is started. */
export const create = mutation({
  args: {},
  returns: v.id("games"),
  handler: async (ctx) =>
    await ctx.db.insert("games", { ...newGame(), abandoned: false }),
});

/** Taking a Seat in the lobby. The rules of who may are the reducer's. */
export const takeSeat = mutation({
  args: { gameId: v.id("games"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, () => ({
      type: "takeSeat",
      name: args.name,
    })),
});

/** »Los geht's«: the Seats are fixed, and the first of them is up. */
export const start = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await play(ctx, args.gameId, () => ({ type: "start" }));
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
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get("games", args.gameId);
    if (game === null) throw new Error("No such Game");
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
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, (state) => ({
      type: "draw",
      card: drawCard(state.deck),
    })),
});

export const roll = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, (state) => ({
      type: "roll",
      faces: rollDice(state.turn.diceInHand),
    })),
});

export const setAside = mutation({
  args: { gameId: v.id("games"), dice: v.array(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, () => ({ type: "setAside", dice: args.dice })),
});

export const stop = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, () => ({ type: "stop" })),
});

export const nextTurn = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) =>
    await play(ctx, args.gameId, () => ({ type: "nextTurn" })),
});
