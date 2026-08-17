import type { Face } from "./game/turn";

/**
 * The geometry of a die drawn as a CSS cube: six faces, each rotated into
 * place and pushed out by half the cube's width. Opposite faces sum to seven,
 * like a real die.
 */
export const FACE_ROTATION: Record<Face, { x: number; y: number }> = {
  1: { x: 0, y: 0 }, // front
  2: { x: 90, y: 0 }, // top
  3: { x: 0, y: 90 }, // right
  4: { x: 0, y: -90 }, // left
  5: { x: -90, y: 0 }, // bottom
  6: { x: 0, y: 180 }, // back
};

export const ALL_FACES: Face[] = [1, 2, 3, 4, 5, 6];

/** Pips as [column, row] on a 3×3 grid. */
export const PIPS: Record<Face, [number, number][]> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [3, 1],
    [1, 3],
    [3, 3],
  ],
  5: [
    [1, 1],
    [3, 1],
    [2, 2],
    [1, 3],
    [3, 3],
  ],
  6: [
    [1, 1],
    [3, 1],
    [1, 2],
    [3, 2],
    [1, 3],
    [3, 3],
  ],
};

/**
 * How the cube must be turned so a given face is the one you read. Each face
 * is placed with a single axis, so negating that placement undoes it exactly —
 * which also leaves the face upright rather than lying on its side.
 */
export const restingRotation = (face: Face) => ({
  x: -FACE_ROTATION[face].x,
  y: -FACE_ROTATION[face].y,
});

/**
 * Where a die's tumble starts. The end is always the resting rotation for the
 * face the server chose, so the seed can only vary the path there — a die is
 * incapable of settling on a face nobody rolled (ADR 0001).
 */
export function startRotation(face: Face, seed: number) {
  const rest = restingRotation(face);
  const turns = (n: number) => 360 * (2 + (n % 3));
  return {
    x: rest.x - turns(seed) - 30 * (seed % 5),
    y: rest.y - turns(seed + 2) + 30 * (seed % 7),
  };
}

/**
 * Where a die comes to rest: the face the server chose, turned by however far
 * off square this one landed.
 *
 * The tilt is written **first**, and that is the whole of why this is a function
 * rather than a template in `Die.tsx`. A transform composes left to right, so
 * the first turn is the outermost and happens in the frame the parent is in —
 * the axis facing the Player. In the plane of the screen, so the face stays the
 * face and the die is only off square. Written last it would be the cube's own
 * z, which after `rotateY(±90)` points sideways: faces 3 and 4 would come to
 * rest showing something nobody rolled, which is the one thing the animation is
 * not allowed to do (ADR 0001).
 */
export const restingTransform = (face: Face, tilt: number) => {
  const rest = restingRotation(face);
  return `rotateZ(${tilt}deg) rotateX(${rest.x}deg) rotateY(${rest.y}deg)`;
};

/**
 * The most a die leans, in degrees. Small on purpose: the point is a hand that
 * looks thrown rather than laid out in a grid, and a die that has to be read at
 * a glance. Past about five degrees the pips start reading as a diamond.
 */
export const MAX_TILT = 5;

/** The least it leans, so no die comes down looking deliberately square. */
export const MIN_TILT = 2;

/**
 * A number from a string, spread evenly enough that neighbouring seeds land
 * nowhere near each other. FNV-1a, which is four lines and needs no dependency.
 */
const hash = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
};

/**
 * How far off square one die of a Roll comes to rest, in degrees about the axis
 * facing the Player.
 *
 * **Rotation only.** A die's box reserves 1.8× its size for the room the cube
 * sweeps through, and that reserve is the whole of the fix for dice painting
 * over one another. An offset would spend it. This cannot: turning about the
 * axis facing the Player moves every point of the cube around the die's own
 * centre without changing its distance from it, so the silhouette is the same
 * silhouette, turned. The reserve is untouched at every angle.
 *
 * Seeded from the Roll as `selection.rollKey` names it, so every device sees the
 * same throw and a re-render is not a new one. That key and not the faces: two
 * Rolls of a Turn can fall exactly alike, and the key carries the Turn's score,
 * its set-aside count and the Seat's Turns taken around them — three numbers
 * that only grow — so it is the one string at hand that cannot repeat within a
 * Seat. The reason lives there, in full, and is not restated here.
 */
export const tiltDegrees = (roll: string, index: number): number => {
  const h = hash(`${roll}/${index}`);
  const size = MIN_TILT + (h % (MAX_TILT - MIN_TILT + 1));
  // A different bit for the sign than for the size, or the two would agree:
  // every left-leaning die would lean by the same amount as its mirror.
  return (h >>> 4) & 1 ? size : -size;
};

export const faceTransform = (face: Face) => {
  const { x, y } = FACE_ROTATION[face];
  return `rotateX(${x}deg) rotateY(${y}deg) translateZ(calc(var(--die-size) / 2))`;
};
