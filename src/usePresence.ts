import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  HEARTBEAT_MS,
  seatPresence,
  windingUp,
  type SeatPresence,
  type WindUp,
} from "./presence";

/**
 * The client half of "who is still here": this device says it is still here
 * while its tab is visible, and reads back what every other Seat has said.
 *
 * Both halves live outside the Game's own subscription. The check-ins are
 * their own query over their own table, so a heartbeat landing three times a
 * minute re-renders the scoreboard and nothing else — not the dice, not the
 * Card, not the position every device at the table is watching.
 *
 * Which is a property of where these hooks are *called*, not of what they
 * return, and it holds only while each is called from the one thing it can
 * change: `usePresence` from the scoreboard row, `useWinding` from the hand.
 * Both hold a clock (ADR 0006) and a clock ticks whether or not anything has
 * happened, so a hook hoisted into the play screen ticks the play screen.
 */

/**
 * How often present-or-away is recomputed. Nothing arrives when a Player walks
 * away — that is the whole point — so the passage of time has to be what turns
 * their Seat over, and it does so within a tick of the threshold.
 */
const TICK_MS = 5_000;

/** The current time, as often as presence needs to be re-decided. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * "Still here", every `HEARTBEAT_MS` while the tab is visible.
 *
 * Only while visible: a browser throttles a background tab's timers anyway,
 * and a Player who has switched to another app is not present in any sense a
 * table-mate cares about. Coming back fires the event and so the next check-in
 * at once, with no reload. A device holding no Seat sends nothing — and would
 * be refused if it did.
 */
function useHeartbeat(gameId: Id<"games">, secret: string | null) {
  const checkIn = useMutation(api.presence.checkIn);
  useEffect(() => {
    if (secret === null) return;
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      // A secret left over from a Game that is gone, or a Game that has since
      // ended: the server refuses it, and there is nothing to tell the Player.
      void checkIn({ gameId, secret }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [checkIn, gameId, secret]);
}

/** Nothing has arrived yet, so there is nothing to say about any Seat. */
const NOT_YET: SeatPresence = () => null;

/**
 * Which Seats still have this Game open, and this device saying that it does.
 * Every Seat answers `null` until the first check-ins arrive, and a Seat this
 * device has had no chance to hear from goes on answering `null` after that —
 * neither is the same as being away.
 *
 * The clock is the client's, because a query cannot hold one: Convex re-runs a
 * query when its data changes and not as time passes, so a threshold applied
 * on the server would go stale in exactly the case that matters — the Seat
 * that has stopped writing anything. A device whose clock is badly set reads
 * every Seat the same way, which is the mild failure of the two, and the whole
 * trade is written down in ADR 0006.
 */
export function usePresence(
  gameId: Id<"games">,
  /** This device's proof of its Seat, or `null` if it holds none. */
  secret: string | null,
): SeatPresence {
  useHeartbeat(gameId, secret);
  const checkIns = useQuery(api.presence.forGame, { gameId });
  const now = useNow();
  // When this device opened the Game. Its own first check-in is still in
  // flight for a moment after the check-ins query has answered, so without
  // this the Player is told that they themselves are away.
  const [watchingSince] = useState(() => Date.now());
  return checkIns === undefined
    ? NOT_YET
    : seatPresence(checkIns, now, watchingSince);
}

/**
 * The hold running at this table right now, or `null` if nobody is winding up.
 *
 * The same query the scoreboard's dots come off, so this is the subscription
 * the table already has rather than a second one — Convex hands both readers
 * the one subscription, and the heartbeat that feeds it is still sent from
 * `usePresence` alone. Which is also why a wind-up rides on the presence row in
 * the first place: it is news about a Player and not about the position, and
 * the Game document every phone watches must not be written to for it.
 *
 * A Spectator gets this too. Tutto hides nothing but the undrawn deck, so
 * everyone watching sees the dice the Player at the table is winding up.
 *
 * Called from the hand and not from the play screen, for the reason the
 * check-ins are their own query at all: it holds a clock, that clock ticks
 * every few seconds whatever the table is doing, and a tick re-renders whatever
 * read it. The hand is the only thing this can change, so the hand is where it
 * is read — the Card, the pile, the »Herausgelegt« row and the Roll on the
 * table are not dragged through a tick that could never have moved them.
 */
export function useWinding(gameId: Id<"games"> | null): WindUp | null {
  const checkIns = useQuery(
    api.presence.forGame,
    gameId === null ? "skip" : { gameId },
  );
  // A hold that nothing was ever heard the end of has to time out, and time
  // passing is not something a query is re-run for — the same clock, held in
  // the same place and for the same reason as present-or-away (ADR 0006).
  const now = useNow();
  return checkIns === undefined ? null : windingUp(checkIns, now);
}
