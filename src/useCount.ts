import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { countAt, countMs } from "./count";

/**
 * A number on screen, counting to whatever it is handed rather than being
 * replaced by it. `count.ts` decides what it reads and for how long; this is
 * the clock that drives it.
 *
 * It counts when the number it is given changes, and never on mount — a screen
 * opening on a Game at 4200 shows 4200, it does not run up to it from nothing.
 * *When* a number is allowed to change is not this hook's business either: the
 * settled position holds every outcome back until the dice have landed
 * (`useSettled.ts`), so a count cannot start early because it is never told
 * early. That separation is also what makes this usable for a drain — a Niete
 * emptying the Turn score is the same count with the numbers the other way
 * round, and nothing here has to know which of the two it is doing.
 */
export const useCount = (target: number): number => useCounts([target])[0];

/**
 * Several numbers counting on one clock, and the values of all of them on every
 * frame.
 *
 * A count each would run the same geometry and read the same, so this exists
 * for the one thing a count each cannot do: the leaderboard ranks its rows on
 * the numbers *being shown*, so it needs them together, in one place, every
 * frame. A row then changes place at the moment its count crosses its
 * neighbour's rather than when the position behind it changed — the number
 * moves the row, and never the other way round.
 *
 * Each number still finishes on its own schedule, because how long a count runs
 * is the size of what happened to that number (`countMs`); the clock simply
 * runs until the longest of them is done. So a Plus/Minus paying one Seat 1000
 * and docking three others plays as four counts of their own lengths, not four
 * counts stretched to match.
 */
export function useCounts(targets: number[]): number[] {
  // The one mechanism for reduced motion in the app, the same hook the dice,
  // the Card and the settled position ask. No movement wanted, no count — and
  // the rows are then simply in their new order, because the numbers they are
  // ranked on are simply their new values.
  const still = useReducedMotion();
  const [shown, setShown] = useState(targets);
  // The numbers on screen, where a frame can read them. A second change
  // part-way through a count starts from here rather than from where the first
  // one began, so a Plus/Minus landing on a count already running carries on
  // down instead of rewinding.
  const at = useRef(targets);

  // The caller builds this array from a subscription and so hands over a new
  // one on every render. What a count turns on is the values, so that is what
  // the effect depends on and what it reads them back out of.
  const key = targets.join(",");

  useEffect(() => {
    const to = key === "" ? [] : key.split(",").map(Number);
    // A screen that has just learned the position, or a Seat taken mid-Game:
    // there is no number to count from, so they are what they are.
    const from = at.current.length === to.length ? at.current : to;
    const runs =
      still === true
        ? 0
        : Math.max(0, ...to.map((n, i) => countMs(from[i], n)));
    if (runs === 0) {
      at.current = to;
      setShown(to);
      return;
    }
    const startedAt = performance.now();
    const step = (now: number) => {
      // A frame's timestamp can be the one the frame started on, which is not
      // necessarily after the moment this was set going. Never a negative
      // elapsed: that is a count running backwards out of where it began.
      const elapsed = Math.max(0, now - startedAt);
      at.current = to.map((n, i) => countAt(from[i], n, elapsed));
      setShown(at.current);
      if (elapsed < runs) frame = requestAnimationFrame(step);
    };
    let frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [key, still]);

  // The render on which the number of Seats changes is one the effect has not
  // run for yet, so the state still holds the old shape. Answer the targets
  // outright rather than a row of blanks — it is what the effect is about to
  // conclude anyway, there being nothing to count from.
  return shown.length === targets.length ? shown : targets;
}
