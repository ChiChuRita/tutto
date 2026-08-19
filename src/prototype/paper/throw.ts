/**
 * PROTOTYPE — throwaway. The path a die turns down, sampled.
 *
 * Why this is TypeScript and not a keyframe. A die has to land showing the face
 * that was rolled, so its resting rotation is per-face and set inline on the
 * element (`Die.tsx`, ADR 0001). A CSS keyframe cannot read that, and the first
 * pass here paid for it twice over:
 *
 *  - It declared `rotateX(...) rotateY(...)` while the element's own transform is
 *    `rotateZ(...) rotateX(...) rotateY(...)`. Different function lists, so the
 *    browser cannot interpolate them one for one — it decomposes both to matrices
 *    and takes its own way round. That is the wobble at the end of the throw, and
 *    `index.css` warns about exactly this.
 *  - It stopped turning at 70% and left the last 30% to that decomposition, so the
 *    die drifted onto its face for 190ms after it had visibly landed.
 *
 * So the stops are computed here from the same `restingRotation` the element
 * uses, every stop says the same three turns in the same order, and the last one
 * *is* the resting rotation. The keyframe then declares no `100%` and interpolates
 * into the element's own transform — which is the same value, so nothing moves and
 * nothing is decomposed. This is the arrangement the real screen already uses;
 * `throw.ts` in the app is the grown-up version of it.
 */
import { restingRotation } from "../../dice";
import type { Face } from "../../game/turn";

/**
 * Where the path is sampled, in percent of the flight. Dense through the fall,
 * and it stops at the impact: a die that has hit the table does not go on
 * spinning while it settles.
 */
export const STOPS = [0, 8, 18, 28, 38, 48, 56, 62];

/** The percent at which the die reaches the table. The bounce is after it. */
export const IMPACT = 62;

/** Turns given up on the way down, in degrees. Not multiples of 360, so the die
 *  does not happen to start on the face it is going to land on. */
const SPIN_X = -700;
const SPIN_Y = 520;

/**
 * How much of the spin is left at a given progress toward the impact. Above
 * linear, so the die is turning fastest as it comes off the throw and is nearly
 * still by the time it touches — a die slows because the table takes the energy,
 * not because it runs out of turns.
 */
const remaining = (u: number) => Math.pow(1 - u, 1.7);

/**
 * The transform at each of `STOPS`, for a die that will land on `face`. Written
 * onto the element as `--r0…--r7`, which is what the keyframe reads.
 */
export const rollPath = (face: Face): string[] => {
  const rest = restingRotation(face);
  return STOPS.map((at) => {
    const left = remaining(Math.min(1, at / IMPACT));
    // The same three turns in the same order as `restingTransform`, which is what
    // lets the browser interpolate them one for one — and at `left === 0` this is
    // that transform exactly, so the last stop and the element's own value are the
    // same string.
    const x = rest.x + SPIN_X * left;
    const y = rest.y + SPIN_Y * left;
    return `rotateZ(0deg) rotateX(${x.toFixed(1)}deg) rotateY(${y.toFixed(1)}deg)`;
  });
};
