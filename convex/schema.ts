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

export const card = v.union(
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
  seats: v.array(
    v.object({
      /** What the Player typed in the lobby. Unique inside one Game. */
      name: v.string(),
      /**
       * The User whose Seat this is, or null for a guest's — which a User may
       * claim later (ADR 0002). The reducer sees an opaque string and never a
       * Convex id; the id is put back on at the one place that writes a Game.
       */
      owner: v.union(v.id("users"), v.null()),
      score: v.number(),
      turnsTaken: v.number(),
    }),
  ),
  activeSeatIndex: v.number(),
  /**
   * A Game waits in its lobby until it is started. Reaching 6000 then opens the
   * Final round rather than winning: play runs on until every Seat's Turn count
   * is level, and then the highest score wins.
   */
  phase: v.union(
    v.literal("lobby"),
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
  /**
   * The Card lying face-up under the one the Turn is holding, and the face on
   * top of the played pile once the Turn has let its own Card go.
   *
   * One Card and never a list: the pile shows two faces and nothing older
   * (ADR 0003), so this is a field that does not grow over a Game — which is
   * what lets it sit on the document every device subscribes to at all.
   *
   * Optional only for the Games that were already being played when the pile
   * started keeping it. Every write since fills it in, `null` included, and
   * `games.get` hands it out filled, so nothing downstream ever sees it absent.
   */
  lastCard: v.optional(v.union(card, v.null())),
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
  })
    /**
     * The Games still waiting in their lobby, so a signed-in Player can find one
     * to join without being sent a link.
     *
     * This table deliberately had no index, and the reason it gave was that a
     * Game is only ever reached by its id, which is what kept one device's Games
     * out of another's list. That is exactly what this reverses, and only for
     * Games in a lobby: an open table is meant to be found. A Game in play is
     * still reachable by id alone, because the reducer refuses a Seat once it
     * has started — there would be nothing to offer.
     *
     * What it costs, stated rather than discovered later: **any signed-in
     * account can see and join any open Game.** Sign-up is open to anyone
     * holding the app's URL, so this is a real hole and not a theoretical one.
     * It is deliberate — this deployment is two people — and the fix when that
     * stops being true is an invite the Game is opened *to* rather than a list
     * of every lobby: a `gameInvites` row per invited User, indexed by User,
     * queried here instead of by phase.
     */
    .index("by_phase", ["phase"]),
  /**
   * What a device holds instead of an account: the secret minted when it took a
   * Seat, which every mutation acting on that Seat carries (ADR 0004).
   *
   * Its own table rather than a field on the Seat, because every device
   * subscribes to the whole Game document — a secret stored there would be
   * handed to everyone at the table, the way a shuffled deck would be
   * (ADR 0003).
   */
  seatSecrets: defineTable({
    gameId: v.id("games"),
    /** The Seat's place in the Game's `seats`, fixed once the Seat is taken. */
    seatIndex: v.number(),
    secret: v.string(),
  }).index("by_game_and_secret", ["gameId", "secret"]),
  /**
   * One row per Seat that has ever checked in: what that Seat's device is
   * saying about itself right now. Who is still here, and what they are doing
   * with the dice.
   *
   * Its own table for the reason the secrets have one — every device
   * subscribes to the whole Game document, so state rewritten there several
   * times a minute would re-render every phone at the table and interleave with
   * real moves. Here it re-renders only what asks for it.
   *
   * This is the one row transient per-Seat state goes on. It is written by the
   * device holding the Seat, with the secret that Seat was given (ADR 0004),
   * and read raw — nothing on it is a fact about the Game, so none of it goes
   * near `src/game/turn.ts` and none of it is ever authoritative.
   */
  presence: defineTable({
    gameId: v.id("games"),
    /** The Seat's place in the Game's `seats`. */
    seatIndex: v.number(),
    /** When that Seat's device last said it was still here. */
    lastSeen: v.number(),
    /**
     * Which dice of the Roll the Player has picked up, so that the whole table
     * watches somebody choosing instead of only the result of it. Absent on a
     * Seat that has never published one.
     *
     * Nothing here is secret: the Roll is already public, so which of it
     * somebody picked up gives nothing away the table cannot already see.
     */
    selection: v.optional(
      v.object({
        /**
         * The Roll the choice was made in, as its faces in order. A watcher
         * draws the choice only while this is still the Roll on its own table,
         * and that is what makes the selection transient without a clearing
         * write: a highlight cannot outlive the dice it points at even if the
         * phone that made it never says another word.
         */
        roll: v.string(),
        /** Places in that Roll the Player has picked up. */
        dice: v.array(v.number()),
      }),
    ),
    /**
     * When that Seat's device last said it was holding »Würfeln« down, so the
     * rest of the table can watch the dice turn instead of waiting on a screen
     * that says nothing for ten seconds.
     *
     * A time and not a level. How long the hold has run changes no odds — the
     * faces are the server's and are chosen on release (ADR 0001) — so there is
     * no charge to send, and a charge sent to a table-mate would be a number
     * about nothing. It rides on this table rather than on the Game document
     * for the reason `lastSeen` does: a field written twice a hold on the
     * document every phone subscribes to would re-render the dice and the Card
     * mid-Turn, and this is decoration.
     */
    rollingSince: v.optional(v.number()),
  }).index("by_game_and_seat", ["gameId", "seatIndex"]),
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
  })
    .index("by_game", ["gameId"])
    // A Seat's best Turn in a Game is the last entry of this index, so
    // head-to-head reads one Turn per Game rather than all of them — and a
    // recorded Turn is a whole replay, so reading them all is not cheap.
    .index("by_game_and_seat_and_score", ["gameId", "seatIndex", "score"]),
});
