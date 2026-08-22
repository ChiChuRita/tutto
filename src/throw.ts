/**
 * The throw: what the dice do between the thumb coming up and the face the
 * server chose.
 *
 * The wind-up (`spin.ts`) and the settle (`settled.ts`) used to meet at a cut.
 * The hold topped out at 1440°/s and the tumble opened at about 3150°/s from an
 * angle derived from the die's seed, so letting go made the dice speed up by
 * 2.2× and jump to an orientation they had never been at. Both were measured
 * rather than felt, and both are gone: a die leaves at the speed and the
 * orientation it actually had, and decays from there.
 *
 * Nothing here decides anything either. The two ends of the path are the angle
 * the hold left the die at and the resting rotation for the face the server
 * chose, and only the middle is ours (ADR 0001). What varies with the hold is
 * how fast the die is going when it leaves and how many whole turns it takes
 * getting there — and a whole turn is invisible at the landing, which is the
 * whole reason it is the thing that varies.
 *
 * **The length may not vary with the hold.** A watching phone never saw the
 * hold, and `animationMs` is pure in the position, so how long the screen
 * withholds a Roll's news is decided without reference to the wind-up. A
 * ten-second hold and a tap take the same time to settle. The difference lives
 * in the decay instead: a hard-held throw sheds its speed more steeply, and the
 * arithmetic below is the whole of how.
 */

import { restingRotation, startRotation } from "./dice";
import type { Face } from "./game/turn";
import type { Nudge } from "./dice";
import { dieSeed } from "./settled";
import { dieSpinSpeed, dieSpunTo } from "./spin";

/**
 * How a thrown die loses its spin, as a share of the speed it left at: the
 * shape the die's whole flight is drawn from, in four acts.
 *
 * These are the same numbers the stylesheet used to say as a `linear()` easing,
 * read off it as speeds rather than as progress. The curve was arrived at
 * against a complaint, and the record is worth keeping. It used to be
 * `cubic-bezier(0.15, 0.75, 0.3, 1)`, which put **41% of the rotation into the
 * first 80ms and 95% of it into the first 458ms** — the die did nearly all its
 * turning in a third of a second and then stood almost still. It was not
 * stopping early; it was stopping *fast*, and then dawdling.
 *
 *   0–12%   airborne, and the first bounces. Full speed, then the first cut.
 *   12–68%  settling. Each bounce takes its share and the decay is monotonic;
 *           nothing speeds up, because a die that sped up mid-roll would read
 *           as a glitch.
 *   68–85%  the teeter. Down to a twelfth of the speed it left at — very nearly
 *           stopped, balanced on an edge. The beat that makes the next one land.
 *   85–96%  the flop. The one deliberate acceleration in the whole shape, back
 *           up to a third: a die falling off its edge onto the face it was
 *           always going to show. Then it decelerates into rest rather than
 *           arriving at speed.
 *
 * Said here and not in CSS because the path is now sampled — the die's angle at
 * each of `TUMBLE_STOPS` is written out as a transform and the browser
 * interpolates between them. Two axes that decay at different rates cannot
 * share one easing function, and after the hand-off they do differ: each axis
 * takes its own whole turns.
 */
const DECAY = [
  { until: 0.06, speed: 1 },
  { until: 0.12, speed: 0.929 },
  { until: 0.2, speed: 0.804 },
  { until: 0.28, speed: 0.67 },
  { until: 0.36, speed: 0.482 },
  { until: 0.44, speed: 0.375 },
  { until: 0.52, speed: 0.321 },
  { until: 0.6, speed: 0.268 },
  { until: 0.68, speed: 0.214 },
  { until: 0.74, speed: 0.179 },
  { until: 0.8, speed: 0.143 },
  { until: 0.85, speed: 0.086 },
  { until: 0.89, speed: 0.321 },
  { until: 0.93, speed: 0.343 },
  { until: 0.96, speed: 0.257 },
  { until: 1, speed: 0.107 },
] as const;

/** How fast the die is turning at `at` through its flight, as a share of the
 * speed it left the hold at — before the throw itself is added in. */
export const decayAt = (at: number): number =>
  (DECAY.find(({ until }) => at < until) ?? DECAY[DECAY.length - 1]).speed;

/**
 * How much of the flight the throw's own push is spread over.
 *
 * A hand does not only let a die go, it throws it, and that is the one thing
 * the die gains that the hold did not give it. Squared rather than straight, so
 * the push starts at nothing: the first frames after the release are then the
 * hold's speed and nothing else, which is what makes the hand-off a hand-off
 * rather than a kick.
 */
const THROW_AT = 0.12;

/** How much of the throw's push has landed by `at`, from 0 to 1. */
const thrownBy = (at: number): number => Math.min(1, at / THROW_AT) ** 2;

/** The push's share of a stretch of the flight — the integral of `thrownBy`. */
const pushOver = (from: number, to: number): number => {
  const ramp =
    (Math.min(to, THROW_AT) ** 3 - Math.min(from, THROW_AT) ** 3) /
    (3 * THROW_AT * THROW_AT);
  return ramp + Math.max(0, to - Math.max(from, THROW_AT));
};

/** The stretches of `DECAY` that finish by `to`, clipped to it. */
const upTo = (to: number) => {
  const spans: { from: number; to: number; speed: number }[] = [];
  let from = 0;
  for (const { until, speed } of DECAY) {
    if (from >= to) break;
    spans.push({ from, to: Math.min(until, to), speed });
    from = until;
  }
  return spans;
};

/** Turns made by `at`, per unit of the speed the die left the hold at. */
const carriedBy = (at: number): number =>
  upTo(at).reduce((sum, span) => sum + span.speed * (span.to - span.from), 0);

/** Turns made by `at`, per unit of the throw's push. */
const thrownOver = (at: number): number =>
  upTo(at).reduce(
    (sum, span) => sum + span.speed * pushOver(span.from, span.to),
    0,
  );

/** The whole flight's worth of each, which is what the push is solved against. */
const CARRIED = carriedBy(1);
const THROWN = thrownOver(1);

/**
 * The least a die may turn, as a share of what it would cover at its release
 * speed for the whole flight.
 *
 * The floor that decides how many whole turns a throw takes. Below it the die
 * would have to shed almost all its speed in the first tenth of the flight and
 * then creep, which reads as the die being caught rather than thrown — so
 * another whole turn goes in instead, and a whole turn is invisible at the
 * landing.
 *
 * `CARRIED` is what a die turns through with no push at all, so anything under
 * that is a die shedding speed faster than the shape alone does. A quarter is
 * about half of that: the steepest decay in the app, and where a full-charge
 * hold usually lands.
 */
const LEAST_TURN = 0.25;

/**
 * How far a die turns during its flight, in degrees, when it carries on from a
 * hold.
 *
 * The residue is fixed: the die starts where the hold left it and ends on the
 * face the server chose, so how far it turns is decided to within a whole turn
 * before anything here runs. All this chooses is how many whole turns go on
 * top — the one part of the path that cannot change the outcome.
 */
export const turnOf = (
  /** Where the die must come to rest, in degrees on this axis. */
  rest: number,
  /** Where the hold left it, in degrees on this axis. */
  start: number,
  /** Degrees a second it was turning at when the thumb came up. */
  released: number,
  /** How long the flight lasts, in seconds. */
  seconds: number,
): number => {
  const residue = (((rest - start) % 360) + 360) % 360;
  const least = LEAST_TURN * released * seconds;
  return residue + 360 * Math.max(0, Math.ceil((least - residue) / 360));
};

/** One axis of a die's flight: where it starts, and where it is on the way. */
export type Flight = {
  /** The angle the die is at when the flight begins, in degrees. */
  from: number;
  /** Degrees a second at `at` through the flight. */
  speedAt: (at: number) => number;
  /** The angle at `at` through the flight, in degrees. */
  angleAt: (at: number) => number;
};

/**
 * One axis of one die's throw.
 *
 * `released` is the speed the hold left the die at, or `null` for a throw with
 * no hold behind it — `Enter`, an assistive click, a phone that opened onto a
 * Roll it never saw wound up. That one starts where the seed says and is given
 * the release speed its own rotation implies, which is the same flight the app
 * played before any of this existed: no push, and the decay shape alone.
 */
export const flightOf = ({
  rest,
  start,
  released,
  seconds,
}: {
  rest: number;
  start: number;
  released: number | null;
  seconds: number;
}): Flight => {
  const from =
    released === null ? start : rest - turnOf(rest, start, released, seconds);
  const turn = rest - from;
  // A die that was never held leaves at whatever speed covers its own rotation
  // under the decay alone, which makes the push below exactly nought.
  const speed = released ?? turn / (seconds * CARRIED);
  const push = (turn / seconds - speed * CARRIED) / THROWN;
  return {
    from,
    speedAt: (at) => (speed + push * thrownBy(at)) * decayAt(at),
    angleAt: (at) =>
      from + seconds * (speed * carriedBy(at) + push * thrownOver(at)),
  };
};

/**
 * Where along the flight the die's angle is written down.
 *
 * The browser interpolates between them, so these are as much of the shape as
 * survives: every boundary in `DECAY` is here, or an act would be smeared into
 * its neighbour — the teeter and the flop especially, which are the two the
 * landing reads from. The three extra near the start are the throw's push,
 * which is the one stretch where the speed is still changing within an act.
 *
 * `index.css` declares exactly these percentages, and the test beside this file
 * reads them back: a keyframe cannot import an array, and a stop that is here
 * and not there is a die whose angle is nobody's arithmetic.
 */
export const TUMBLE_STOPS = [
  0, 0.015, 0.03, 0.06, 0.09, 0.12, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68,
  0.74, 0.8, 0.85, 0.89, 0.93, 0.96,
] as const;

/** Degrees, rounded to what a transform can tell apart. */
const deg = (angle: number): string => `${Math.round(angle * 100) / 100}deg`;

/**
 * The flight of one die, both axes, for anything that needs to know how fast it
 * is going rather than where it is pointing — the tests, and nothing else.
 */
export const dieFlight = ({
  face,
  index,
  heldMs,
  flightMs,
}: {
  face: Face;
  index: number;
  heldMs: number | null;
  flightMs: number;
}): { x: Flight; y: Flight } => {
  const rest = restingRotation(face);
  const seconds = flightMs / 1000;
  const start =
    heldMs === null
      ? startRotation(face, dieSeed(index, face))
      : dieSpunTo(heldMs, index);
  const released = heldMs === null ? null : dieSpinSpeed(heldMs);
  return {
    x: flightOf({
      rest: rest.x,
      start: start.x,
      released: released?.x ?? null,
      seconds,
    }),
    y: flightOf({
      rest: rest.y,
      start: start.y,
      released: released?.y ?? null,
      seconds,
    }),
  };
};

/**
 * One die's whole flight, as the transform it wears at each of `TUMBLE_STOPS`.
 *
 * The keyframe stops at 96% and the browser takes the last stretch to the
 * resting transform the die is already wearing — the same trick the old
 * two-ended keyframe played, and for the same reason: the landing is the
 * element's own rotation, so no arithmetic here can miss it (ADR 0001).
 *
 * The lean comes in over the flight rather than being there from the first
 * frame. A die winding up has no lean — there is no Roll to have one from — so
 * a die that started the tumble already leaning would jump by those few degrees
 * on the frame the thumb came up.
 */
export const throwPath = ({
  face,
  index,
  tilt,
  nudge,
  heldMs,
  flightMs,
}: {
  face: Face;
  index: number;
  /** How far off square this die comes down, in degrees. */
  tilt: number;
  /**
   * How far off centre it comes to rest, as a share of the die.
   *
   * Written into every stop and never varied, so the die tumbles where it lands
   * rather than sliding into place. It is here at all because it has to be: the
   * keyframe has no `100%`, so the last stop interpolates to the element's own
   * resting transform, and that is one-for-one only while both are the same list
   * of functions in the same order. A `translate` on one end and not the other
   * hands the browser two matrices to decompose, and the path stops being the
   * path (`index.css`, on `die-tumble`).
   */
  nudge: Nudge;
  /** How long the hold ran, or `null` for a throw with no hold behind it. */
  heldMs: number | null;
  /** How long this die is in the air, in milliseconds. */
  flightMs: number;
}): string[] => {
  const { x, y } = dieFlight({ face, index, heldMs, flightMs });
  return TUMBLE_STOPS.map(
    (at) =>
      `translate(${nudge.x}%, ${nudge.y}%) ` +
      `rotateZ(${deg(tilt * at)}) rotateX(${deg(x.angleAt(at))}) ` +
      `rotateY(${deg(y.angleAt(at))})`,
  );
};
