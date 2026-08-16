import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  applyEvent,
  newGame,
  type Face,
  type GameEvent,
  type GameState,
} from "../src/game/turn";

/**
 * Dice are generated here and nowhere else (ADR 0001): the Roll, the rules and
 * the score all land in one transaction. These functions hold no game logic —
 * they load the Game, hand it to the reducer, and write back what comes out.
 */

const stateOf = (game: Doc<"games">): GameState => ({
  seats: game.seats,
  activeSeatIndex: game.activeSeatIndex,
  turn: game.turn,
});

const rollDice = (count: number): Face[] =>
  Array.from(
    { length: count },
    () => (Math.floor(Math.random() * 6) + 1) as Face,
  );

async function play(
  ctx: MutationCtx,
  gameId: Id<"games">,
  event: (state: GameState) => GameEvent,
) {
  const game = await ctx.db.get("games", gameId);
  if (game === null) throw new Error("No such Game");
  const state = stateOf(game);
  await ctx.db.replace("games", gameId, applyEvent(state, event(state)));
  return null;
}

export const create = mutation({
  args: {},
  returns: v.id("games"),
  handler: async (ctx) => await ctx.db.insert("games", newGame()),
});

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => await ctx.db.get("games", args.gameId),
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
