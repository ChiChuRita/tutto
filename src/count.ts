/**
 * A number moving through the values between where it was and where it now is,
 * rather than being replaced by the second one. Banking 1150 counts up to it; a
 * Plus/Minus taking 1000 off the leaders counts them down; a Niete drains the
 * Turn's score away. One mechanism, both directions — the drain is a count with
 * the numbers the other way round, and nothing here knows which it is doing.
 *
 * This is geometry over time and nothing else. What the numbers mean, and above
 * all *when* they are allowed to change, is not decided here: the count starts
 * when the number it is given changes, and the settled position (`settled.ts`)
 * is what holds that back until the dice have landed. So a count can never
 * announce an outcome early — it has no way to know one.
 */

/**
 * The longest a count runs, whatever there is to count. It is a flourish
 * between taps and the Player is waiting to act, so this is not a duration the
 * screen's news waits for: `animationMs` says how long the table is still
 * moving, and by the time a count starts that wait is already over. Adding it
 * there would delay the next tap by exactly the flourish meant to fill it.
 */
export const COUNT_MS = 500;

/**
 * The smallest thing that ever happens to a score: a lone 5. Every score in
 * Tutto is a multiple of it, so a count that shows 4237 on its way is an
 * odometer rather than points being won.
 */
const STEP = 50;

/** How long the screen dwells on each of those steps, before the cap. */
const STEP_MS = 25;

/**
 * How long the count from `from` to `to` runs. The size of what happened is in
 * the length as well as in the numbers: a lone 5 is one step and is over before
 * the thumb has lifted, a Tutto's worth of points is the long one, and a number
 * that has not moved does not count at all.
 */
export function countMs(from: number, to: number): number {
  return Math.min(COUNT_MS, (Math.abs(to - from) / STEP) * STEP_MS);
}

/** What the number reads `elapsed` ms into a count from `from` to `to`. */
export function countAt(from: number, to: number, elapsed: number): number {
  const runs = countMs(from, to);
  if (elapsed >= runs) return to;
  const gone = from + (to - from) * (elapsed / runs);
  return Math.round(gone / STEP) * STEP;
}
