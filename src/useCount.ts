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
export function useCount(target: number): number {
  // The one mechanism for reduced motion in the app, the same hook the dice,
  // the Card and the settled position ask. No movement wanted, no count.
  const still = useReducedMotion();
  const [shown, setShown] = useState(target);
  // The number on screen, where a frame can read it. A second change part-way
  // through a count starts from here rather than from where the first one
  // began, so a Plus/Minus landing on a count already running carries on down
  // instead of rewinding.
  const at = useRef(target);

  useEffect(() => {
    const from = at.current;
    const runs = still === true ? 0 : countMs(from, target);
    if (runs === 0) {
      at.current = target;
      setShown(target);
      return;
    }
    const startedAt = performance.now();
    const step = (now: number) => {
      // A frame's timestamp can be the one the frame started on, which is not
      // necessarily after the moment this was set going. Never a negative
      // elapsed: that is a count running backwards out of where it began.
      const elapsed = Math.max(0, now - startedAt);
      at.current = countAt(from, target, elapsed);
      setShown(at.current);
      if (elapsed < runs) frame = requestAnimationFrame(step);
    };
    let frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, still]);

  return shown;
}
