import { describe, expect, test } from "vitest";
import {
  MAX_TILT,
  MIN_TILT,
  FACE_ROTATION,
  restingRotation,
  restingTransform,
  startRotation,
  tiltDegrees,
} from "./dice";
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

const rotateZ = (degrees: number): Matrix => {
  const [c, s] = [Math.cos(radians(degrees)), Math.sin(radians(degrees))];
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
};

const rotation = ({ x, y }: { x: number; y: number }) =>
  multiply(rotateX(x), rotateY(y));

const TURNS: Record<string, (degrees: number) => Matrix> = {
  rotateX,
  rotateY,
  rotateZ,
};

/**
 * A CSS transform read the way the browser reads it: the turns composed left to
 * right, so the first one written is the outermost and happens in the frame the
 * element's parent is in.
 */
const parse = (transform: string): Matrix =>
  [...transform.matchAll(/(rotate[XYZ])\((-?[\d.]+)deg\)/g)].reduce(
    (matrix, [, turn, degrees]) =>
      multiply(matrix, TURNS[turn](Number(degrees))),
    IDENTITY,
  );

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

/**
 * The tilt: a die of a Roll rests a couple of degrees off square, so a hand
 * reads as thrown rather than laid out. It is decoration on the resting
 * rotation, so what has to be true of it is that it is small, that it is the
 * same everywhere, and that it does not repeat a neighbour.
 */
describe("a die rests at its own slight angle", () => {
  test("the same Roll tilts the same way on every device", () => {
    const once = [0, 1, 2].map((index) => tiltDegrees("1234:0:0:0", index));
    const again = [0, 1, 2].map((index) => tiltDegrees("1234:0:0:0", index));
    expect(again).toEqual(once);
  });

  test("it is a slight angle, never square and never a lean", () => {
    for (let index = 0; index < 200; index++) {
      const tilt = tiltDegrees(`roll-${index}`, index % 6);
      expect(Math.abs(tilt)).toBeGreaterThanOrEqual(MIN_TILT);
      expect(Math.abs(tilt)).toBeLessThanOrEqual(MAX_TILT);
    }
  });

  test("the dice of one Roll do not all land the same way", () => {
    const hand = [0, 1, 2, 3, 4, 5].map((index) =>
      tiltDegrees("112233:0:0:0", index),
    );
    expect(new Set(hand).size).toBeGreaterThan(3);
  });

  /**
   * The trap the shared-selection lane had to fix in its own key: a TUTTO, or
   * the Seat's next Turn, hands all six dice back, so a later Roll can fall
   * exactly as an earlier one did. `selection.rollKey` carries the position
   * around the faces for exactly that reason, and the tilt rides on the whole
   * key rather than on the faces, so the two throws arrange differently.
   */
  test("two identical Rolls in one Turn arrange differently", () => {
    const before = [0, 1, 2, 3, 4, 5].map((index) =>
      tiltDegrees("123456:0:0:3", index),
    );
    const afterTutto = [0, 1, 2, 3, 4, 5].map((index) =>
      tiltDegrees("123456:0:2000:3", index),
    );
    expect(afterTutto).not.toEqual(before);
  });

  /**
   * The one thing the tilt is not allowed to do (ADR 0001). The order in the
   * transform is the whole of it: written first, the turn happens in the frame
   * the perspective is in — the axis facing the Player — and only spins the
   * silhouette in the plane of the screen. Written last it would be the cube's
   * own z, which for faces 3 and 4 points sideways, and the die would come to
   * rest showing something nobody rolled.
   *
   * So the test reads the transform back the way the browser does, applies the
   * turns in the order it finds them, and asks what is facing the camera.
   */
  test.each(faces)("a tilt leaves face %i the face that is up", (face) => {
    for (const tilt of [MAX_TILT, -MAX_TILT, MIN_TILT, -MIN_TILT]) {
      const settled = multiply(
        parse(restingTransform(face, tilt)),
        rotation(FACE_ROTATION[face]),
      );
      // The chosen face's outward normal, which starts as the cube's +z.
      const normal = [settled[0][2], settled[1][2], settled[2][2]];
      expect(normal[2]).toBeCloseTo(1, 6);
      // And it is turned in the plane of the screen by exactly the tilt: the
      // die is off square, not leaning away from the Player.
      const upright = [settled[0][1], settled[1][1], settled[2][1]];
      expect(upright[2]).toBeCloseTo(0, 6);
      expect(Math.atan2(-upright[0], upright[1]) * (180 / Math.PI)).toBeCloseTo(
        tilt,
        6,
      );
    }
  });
});
