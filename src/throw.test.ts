import { describe, expect, test } from "vitest";
import css from "./index.css?raw";
import { ALL_FACES, restingRotation } from "./dice";
import { HAND, dieSpinSpeed, dieSpunTo, CHARGE_MS } from "./spin";
import { dieFlightMs } from "./settled";
import { TUMBLE_STOPS, decayAt, dieFlight, throwPath, turnOf } from "./throw";

/**
 * Letting go of the dice looks like letting go of the dice: the die leaves at
 * the speed and the orientation the hold actually left it at, and decays from
 * there onto the face the server chose (ADR 0001). What may not vary with the
 * hold is how long any of it takes.
 */

/** A tap, a lean, a good hold, a full charge, and one past the top of it. */
const HOLDS = [0, 40, 250, 1_000, 3_000, CHARGE_MS, CHARGE_MS * 2];
const DICE = Array.from({ length: HAND }, (_, index) => index);

/** Every die of a hand, at every face, over every length of hold. */
const throws = HOLDS.flatMap((heldMs) =>
  DICE.flatMap((index) =>
    ALL_FACES.map((face) => ({
      heldMs,
      index,
      face,
      flightMs: dieFlightMs(index),
    })),
  ),
);

/** Every twentieth of the flight, and both ends of it. */
const along = Array.from({ length: 41 }, (_, step) => step / 40);

describe("the throw carries on from the hold", () => {
  test("the die leaves at exactly the speed it was turning at", () => {
    for (const it of throws) {
      const { x, y } = dieFlight(it);
      const was = dieSpinSpeed(it.heldMs);
      expect(y.speedAt(0)).toBeCloseTo(was.y, 6);
      expect(x.speedAt(0)).toBeCloseTo(was.x, 6);
    }
  });

  test("the die leaves from exactly the angle it was at", () => {
    for (const it of throws) {
      const { x, y } = dieFlight(it);
      const was = dieSpunTo(it.heldMs, it.index);
      // A whole turn is the same orientation, and whole turns are the one thing
      // the throw is allowed to add.
      expect((y.from - was.y) % 360).toBeCloseTo(0, 6);
      expect((x.from - was.x) % 360).toBeCloseTo(0, 6);
    }
  });

  test("a hard-held throw is faster off the release than a tapped one", () => {
    const tap = dieFlight({ face: 3, index: 0, heldMs: 0, flightMs: 1000 });
    const held = dieFlight({
      face: 3,
      index: 0,
      heldMs: CHARGE_MS,
      flightMs: 1000,
    });
    expect(held.y.speedAt(0)).toBeGreaterThan(tap.y.speedAt(0) * 4);
  });

  test("and the difference is a decay rate, not a duration", () => {
    // Both flights are the same length — the caller decides that and neither
    // of these knows the hold. What the hold changes is how much of the speed
    // is left a third of the way down.
    const share = (heldMs: number) => {
      const { y } = dieFlight({ face: 3, index: 0, heldMs, flightMs: 1000 });
      return y.speedAt(0.33) / y.speedAt(0);
    };
    expect(share(CHARGE_MS)).toBeLessThan(share(0));
  });
});

describe("the throw still lands where the server said", () => {
  test("every die comes to rest on its face, at the resting rotation", () => {
    for (const it of throws) {
      const { x, y } = dieFlight(it);
      const rest = restingRotation(it.face);
      expect(x.angleAt(1)).toBeCloseTo(rest.x, 6);
      expect(y.angleAt(1)).toBeCloseTo(rest.y, 6);
    }
  });

  test("a throw with no hold behind it flies as it always did", () => {
    // `Enter`, an assistive click, a phone that opened onto a Roll: no hold to
    // carry on from, so the seed picks the path and the decay shape alone
    // flies it — no push at all.
    const { y } = dieFlight({
      face: 5,
      index: 2,
      heldMs: null,
      flightMs: 1000,
    });
    for (const at of along) {
      expect(y.speedAt(at)).toBeCloseTo(y.speedAt(0) * decayAt(at), 6);
    }
  });

  test("the extra rotation goes in as whole turns", () => {
    const rest = 90;
    const start = 12_345.6;
    const residue = (((rest - start) % 360) + 360) % 360;
    for (const released of [180, 600, 1440]) {
      const turn = turnOf(rest, start, released, 1);
      expect((turn - residue) % 360).toBeCloseTo(0, 9);
      expect(turn).toBeGreaterThanOrEqual(residue);
    }
    // A harder hold buys more of them, which is what a faster die needs and
    // what the landing cannot see.
    expect(turnOf(rest, start, 1440, 1)).toBeGreaterThan(
      turnOf(rest, start, 180, 1),
    );
  });
});

describe("the shape of the fall survives the hand-off", () => {
  test("nothing speeds up through the settle", () => {
    for (const it of throws) {
      const { x, y } = dieFlight(it);
      for (const axis of [x, y]) {
        let last = Infinity;
        for (const at of along.filter((a) => a >= 0.12 && a < 0.85)) {
          const speed = axis.speedAt(at);
          expect(speed).toBeLessThanOrEqual(last + 1e-9);
          expect(speed).toBeGreaterThan(0);
          last = speed;
        }
      }
    }
  });

  test("the die still flops off its edge near the end", () => {
    for (const it of throws) {
      const { y } = dieFlight(it);
      // Both halves of it: the die comes off its edge at 85% and is still
      // going at 91%, against a teeter that had all but stopped.
      expect(y.speedAt(0.87)).toBeGreaterThan(y.speedAt(0.84) * 2);
      expect(y.speedAt(0.91)).toBeGreaterThan(y.speedAt(0.84) * 2);
      // Then it decelerates into rest rather than arriving at speed.
      expect(y.speedAt(0.98)).toBeLessThan(y.speedAt(0.91));
    }
  });

  test("the push starts at nothing, so the release is not a kick", () => {
    const { y } = dieFlight({
      face: 3,
      index: 0,
      heldMs: 0,
      flightMs: 1000,
    });
    // A hundredth of the flight in — about a frame and a half — the die is
    // still within a couple of per cent of the speed it left at.
    expect(y.speedAt(0.01) / y.speedAt(0)).toBeLessThan(1.05);
  });
});

/**
 * The path is written down twice — as `TUMBLE_STOPS` here and as the keyframe's
 * percentages in `index.css` — because a keyframe cannot import an array. This
 * is the test that comment promises: a stop in one and not the other is a die
 * whose angle at that moment is nobody's arithmetic.
 */
describe("the keyframe stops where the path is written down", () => {
  const frame = /@keyframes die-tumble\s*\{([\s\S]*?)\n\}/.exec(css);

  test("it declares exactly the stops the path samples", () => {
    expect(frame).not.toBeNull();
    const stops = [...(frame?.[1] ?? "").matchAll(/([\d.]+)%\s*\{/g)].map(
      (match) => Number(match[1]) / 100,
    );
    expect(stops).toEqual([...TUMBLE_STOPS]);
  });

  test("each stop wears the transform the die is given for it", () => {
    const wearing = [
      ...(frame?.[1] ?? "").matchAll(/transform:\s*var\(--t(\d+)\)/g),
    ].map((match) => Number(match[1]));
    expect(wearing).toEqual(TUMBLE_STOPS.map((_, index) => index));
  });

  test("a die is given one transform for every stop", () => {
    const path = throwPath({
      face: 4,
      index: 1,
      tilt: 3,
      heldMs: 2_000,
      flightMs: 1000,
    });
    expect(path).toHaveLength(TUMBLE_STOPS.length);
    // The same three turns in the same order as the resting transform, which is
    // what makes the browser interpolate them one for one rather than
    // decomposing a matrix and taking its own way round.
    for (const step of path) {
      expect(step).toMatch(
        /^rotateZ\(-?[\d.]+deg\) rotateX\(-?[\d.]+deg\) rotateY\(-?[\d.]+deg\)$/,
      );
    }
  });

  test("the lean comes in over the flight rather than being there at once", () => {
    // A die winding up has no lean, so a tumble that started leaning would jump
    // by those few degrees on the frame the thumb came up.
    const path = throwPath({
      face: 4,
      index: 1,
      tilt: 4,
      heldMs: 2_000,
      flightMs: 1000,
    });
    expect(path[0]).toMatch(/^rotateZ\(0deg\)/);
    expect(path[path.length - 1]).toMatch(/^rotateZ\(3.84deg\)/);
  });
});
