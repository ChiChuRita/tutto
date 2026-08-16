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
  seats: v.array(v.object({ score: v.number(), turnsTaken: v.number() })),
  activeSeatIndex: v.number(),
  /**
   * Reaching 6000 opens the Final round rather than winning: play runs on until
   * every Seat's Turn count is level, and then the highest score wins.
   */
  phase: v.union(
    v.literal("playing"),
    v.literal("finalRound"),
    v.literal("over"),
  ),
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
      v.literal("won"),
    ),
    card: v.union(card, v.null()),
    diceInHand: v.number(),
    roll: v.union(v.array(face), v.null()),
    setAside: v.array(face),
    score: v.number(),
    tutto: v.boolean(),
    /** Tuttos since the Card in force was drawn: the Kleeblatt wants two. */
    cardTuttos: v.number(),
  }),
};

/**
 * One move of a recorded Turn, mirroring `TurnStep` in `src/game/history.ts`.
 * Together with the ending they replay the Turn move for move.
 */
const turnStep = v.union(
  v.object({ type: v.literal("draw"), card }),
  v.object({ type: v.literal("roll"), faces: v.array(face) }),
  v.object({
    type: v.literal("setAside"),
    faces: v.array(face),
    tutto: v.boolean(),
  }),
);

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  /**
   * The live position and nothing else. Every Seat subscribes to this document,
   * so it must not grow as the Game runs — history lives in `turns`.
   */
  games: defineTable({
    ...gameFields,
    /** Ended by a Player rather than by a win: final scores, but no winner. */
    abandoned: v.boolean(),
  }).index("by_phase", ["phase"]),
  /**
   * Every Turn as it was played. Written while the Turn runs, because none of
   * it can be reconstructed from a later position.
   */
  turns: defineTable({
    gameId: v.id("games"),
    seatIndex: v.number(),
    steps: v.array(turnStep),
    /** How the Turn ended, or `null` while it is still being played. */
    ending: v.union(
      v.literal("stopped"),
      v.literal("null"),
      v.literal("stopCard"),
      v.literal("won"),
      v.literal("abandoned"),
      v.null(),
    ),
    /** Points this Turn put into its Seat. A Niete leaves nothing. */
    score: v.number(),
  }).index("by_game", ["gameId"]),
});
