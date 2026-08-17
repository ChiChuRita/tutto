import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { GameState } from "./game/turn";
import { animationMs } from "./settled";

/**
 * The settled position: the one the screen speaks from, which lags the true one
 * until the animation for the newest event has finished.
 *
 * Without it, every element renders the subscription the instant it arrives and
 * the outcome is read before it is seen — »Niete!« while the cubes are still
 * turning, the score already at zero, the buttons already changed. Holding each
 * of those back on its own would be eight places to remember; this is one.
 *
 * It is still a replay (ADR 0001). The server chose the faces, `animationMs` is
 * pure, and the lag is decided from the same keys that mount the dice and the
 * Card — so a Spectator, a waiting Seat and the Player rolling all run this off
 * the same subscription and learn the news at the same point in their own dice.
 * Nothing here decides an outcome, and nothing here can.
 */
export type Settled<T> = {
  /**
   * The newest position whose animation has finished, and `null` until the
   * first one has — a screen that has just opened on a Roll in flight knows
   * what the dice will say and must not say it first.
   */
  position: T | null;
  /**
   * Something is still moving, so no move the settled position offers is really
   * on: it is the position from before the event the animation is showing, and
   * the server would refuse a move made from it.
   */
  settling: boolean;
};

/**
 * The play screen's position, held back until the screen has caught up with it.
 *
 * The wait is a deadline rather than a timer per event, because two animations
 * can be running at once — a die commits into »Herausgelegt« while the Card it
 * was drawn under is still turning over — and the news is owed to the last of
 * them, not the last one to start.
 */
export function useSettled<T extends GameState>(
  live: T | null | undefined,
): Settled<T> {
  // The one mechanism for reduced motion in the app, the same hook the dice and
  // the Card ask. No animation to protect means no news to hold back.
  const still = useReducedMotion();
  const [settled, setSettled] = useState<Settled<T>>({
    position: null,
    settling: true,
  });
  /** The last position this has worked out an animation for. */
  const played = useRef<T | null>(null);
  /** When the screen will have stopped moving, on the client's clock. */
  const until = useRef(0);

  // Before paint, not after it: a position with nothing to play is settled in
  // the frame it arrives in, so reduced motion and a quiet Turn never flash the
  // empty screen this starts on.
  useLayoutEffect(() => {
    if (live === null || live === undefined) return;
    const now = Date.now();
    if (played.current !== live) {
      until.current = Math.max(
        until.current,
        now + animationMs(played.current, live, still === true),
      );
      played.current = live;
    }
    const wait = until.current - now;
    if (wait <= 0) {
      setSettled({ position: live, settling: false });
      return;
    }
    setSettled((current) =>
      current.settling ? current : { ...current, settling: true },
    );
    const timer = setTimeout(
      () => setSettled({ position: live, settling: false }),
      wait,
    );
    return () => clearTimeout(timer);
  }, [live, still]);

  return settled;
}
