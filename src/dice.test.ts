import { describe, expect, test } from "vitest";
import { FACE_ROTATION, restingRotation, startRotation } from "./dice";
import type { Face } from "./game/turn";

/**
 * The animation is a replay of a decided result (ADR 0001), so the one thing
 * worth proving is that a die's resting rotation undoes the placement of the
 * face the server chose. Composed, the two must come out as the identity: the
 * chosen face points at the camera, the right way up.
 */

type Matrix = number[][];

const multiply = (a: Matrix, b: Matrix): Matrix =>
  a.map((row, i) =>
    b[0].map((_, j) => row.reduce((sum, _v, k) => sum + a[i][k] * b[k][j], 0)),
  );

const radians = (degrees: number) => (degrees * Math.PI) / 180;

const rotateX = (degrees: number): Matrix => {
  const [c, s] = [Math.cos(radians(degrees)), Math.sin(radians(degrees))];
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c],
  ];
};

const rotateY = (degrees: number): Matrix => {
  const [c, s] = [Math.cos(radians(degrees)), Math.sin(radians(degrees))];
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ];
};

const rotation = ({ x, y }: { x: number; y: number }) =>
  multiply(rotateX(x), rotateY(y));

const IDENTITY: Matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const faces: Face[] = [1, 2, 3, 4, 5, 6];

describe("a die settles on the face it was given", () => {
  test.each(faces)("face %i ends up facing the camera, upright", (face) => {
    const settled = multiply(
      rotation(restingRotation(face)),
      rotation(FACE_ROTATION[face]),
    );
    settled.forEach((row, i) =>
      row.forEach((value, j) => expect(value).toBeCloseTo(IDENTITY[i][j], 6)),
    );
  });

  test.each(faces)("face %i has 7 minus itself on the far side", (face) => {
    const settled = rotation(restingRotation(face));
    const hidden = multiply(
      settled,
      rotation(FACE_ROTATION[(7 - face) as Face]),
    );
    // The far side's outward normal points away from the camera.
    const normal = [hidden[0][2], hidden[1][2], hidden[2][2]];
    expect(normal[0]).toBeCloseTo(0, 6);
    expect(normal[1]).toBeCloseTo(0, 6);
    expect(normal[2]).toBeCloseTo(-1, 6);
  });

  test.each(faces)("every tumble of face %i ends at rest", (face) => {
    const rest = restingRotation(face);
    for (let seed = 0; seed < 20; seed++) {
      const start = startRotation(face, seed);
      // A start is whole turns plus a tilt away from rest, never a different
      // resting rotation: the animation interpolates back to `rest` exactly.
      expect(Math.abs(start.x - rest.x)).toBeGreaterThan(360);
      expect(Math.abs(start.y - rest.y)).toBeGreaterThan(360);
    }
  });
});
