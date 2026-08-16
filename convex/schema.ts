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

/**
 * The live position of a Game, mirroring the reducer's `GameState` in
 * `src/game/turn.ts`. The two are kept in step by the compiler: `convex/games.ts`
 * hands a document straight to the reducer and writes its result back.
 */
export const gameFields = {
  seats: v.array(v.object({ score: v.number() })),
  activeSeatIndex: v.number(),
  turn: v.object({
    phase: v.union(
      v.literal("awaitingRoll"),
      v.literal("awaitingSetAside"),
      v.literal("niete"),
      v.literal("stopped"),
    ),
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
