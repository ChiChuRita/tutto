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

export const faceTransform = (face: Face) => {
  const { x, y } = FACE_ROTATION[face];
  return `rotateX(${x}deg) rotateY(${y}deg) translateZ(calc(var(--die-size) / 2))`;
};
