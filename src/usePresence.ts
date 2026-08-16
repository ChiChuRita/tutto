import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { HEARTBEAT_MS, presentSeats } from "./presence";

/**
 * The client half of "who is still here": this device says it is still here
 * while its tab is visible, and reads back what every other Seat has said.
 *
 * Both halves live outside the Game's own subscription. The check-ins are
 * their own query over their own table, so a heartbeat landing three times a
 * minute re-renders the scoreboard and nothing else — not the dice, not the
 * Card, not the position every device at the table is watching.
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

/**
 * Which Seats still have this Game open, and this device saying that it does.
 * `null` until the first answer arrives, which is not the same as everybody
 * being away.
 *
 * The clock is the client's, because a query cannot hold one: Convex re-runs a
 * query when its data changes and not as time passes, so a threshold applied
 * on the server would go stale in exactly the case that matters — the Seat
 * that has stopped writing anything. A device whose clock is badly set reads
 * every Seat the same way, which is the mild failure of the two.
 */
export function usePresence(
  gameId: Id<"games">,
  /** This device's proof of its Seat, or `null` if it holds none. */
  secret: string | null,
): ReadonlySet<number> | null {
  useHeartbeat(gameId, secret);
  const checkIns = useQuery(api.presence.forGame, { gameId });
  const now = useNow();
  return checkIns === undefined ? null : presentSeats(checkIns, now);
}
