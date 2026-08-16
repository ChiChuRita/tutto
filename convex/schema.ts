import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const face = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
  v.literal(6),
);

const card = v.union(
  v.literal("bonus200"),
  v.literal("bonus300"),
  v.literal("bonus400"),
  v.literal("bonus500"),
  v.literal("bonus600"),
  v.literal("stop"),
  v.literal("fireworks"),
  v.literal("straight"),
  v.literal("plusMinus"),
  v.literal("x2"),
  v.literal("cloverleaf"),
);

/**
 * The live position of a Game, mirroring the reducer's `GameState` in
 * `src/game/turn.ts`. The two are kept in step by the compiler: `convex/games.ts`
 * hands a document straight to the reducer and writes its result back.
 */
export const gameFields = {
  seats: v.array(v.object({ score: v.number() })),
  activeSeatIndex: v.number(),
  /**
   * How many of each Card are still to come. Never an order: a stored order
   * would show every subscriber where the Cloverleaf is (ADR 0003).
   */
  deck: v.object({
    bonus200: v.number(),
    bonus300: v.number(),
    bonus400: v.number(),
    bonus500: v.number(),
    bonus600: v.number(),
    stop: v.number(),
    fireworks: v.number(),
    straight: v.number(),
    plusMinus: v.number(),
    x2: v.number(),
    cloverleaf: v.number(),
  }),
  turn: v.object({
    phase: v.union(
      v.literal("awaitingCard"),
      v.literal("awaitingRoll"),
      v.literal("awaitingSetAside"),
      v.literal("null"),
      v.literal("stopped"),
      v.literal("stopCard"),
    ),
    card: v.union(card, v.null()),
    diceInHand: v.number(),
    roll: v.union(v.array(face), v.null()),
    setAside: v.array(face),
    score: v.number(),
    tutto: v.boolean(),
  }),
};

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  games: defineTable(gameFields),
});
