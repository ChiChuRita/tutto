import { describe, expect, it } from "vitest";
import {
  CHARGE_MS,
  HAND,
  SPIN_MAX_DPS,
  SPIN_MIN_DPS,
  dieSpin,
  dieSpinTransform,
  spinSpeed,
  spinningSince,
  spunTo,
} from "./spin";

/**
 * The wind-up, which decides nothing. The server chooses the faces on release
 * and from the same source it always has (ADR 0001), so everything here is
 * about how fast the cubes are turning and about nothing else — there is no
 * charge level in this module because there is no charge, and a number the
 * screen could print would invite the belief that a longer hold rolls better.
 */

/** Every tenth of the charge, plus a good while past the end of it. */
const along = (to: number) =>
  Array.from({ length: 41 }, (_, step) => (step * to) / 40);

describe("how fast the dice turn while you hold", () => {
  it("turns at the resting speed the instant you press", () => {
    expect(spinSpeed(0)).toBe(SPIN_MIN_DPS);
  });

  it("reaches full speed at the end of the charge", () => {
    expect(spinSpeed(CHARGE_MS)).toBe(SPIN_MAX_DPS);
  });

  it("goes no faster however long you hold on", () => {
    expect(spinSpeed(CHARGE_MS * 3)).toBe(SPIN_MAX_DPS);
    expect(spinSpeed(600_000)).toBe(SPIN_MAX_DPS);
  });

  it("never slows down on the way", () => {
    const speeds = along(CHARGE_MS * 1.5).map(spinSpeed);
    speeds.forEach((speed, index) => {
      if (index > 0) expect(speed).toBeGreaterThanOrEqual(speeds[index - 1]);
    });
  });

  it("gains most of its speed early, so a short hold is worth making", () => {
    // A fifth of the charge is already past a third of the way up. A linear
    // ramp would be at exactly a fifth, and the first seconds of the hold —
    // the only ones most Players will ever use — would read as dead.
    const gained =
      (spinSpeed(CHARGE_MS * 0.2) - SPIN_MIN_DPS) /
      (SPIN_MAX_DPS - SPIN_MIN_DPS);
    expect(gained).toBeGreaterThan(1 / 3);
  });

  it("is still turning before anyone has held anything", () => {
    // The dice never stand still mid-spin: a cube resting on a readable face
    // for even a moment is a face the Player could take for a result.
    expect(SPIN_MIN_DPS).toBeGreaterThan(0);
  });
});

describe("how far the dice have turned", () => {
  it("has turned nowhere at the moment of the press", () => {
    expect(spunTo(0)).toEqual({ x: 0, y: 0 });
  });

  it("turns on both axes, so it reads as a cube and not as a wheel", () => {
    const turned = spunTo(CHARGE_MS / 2);
    expect(turned.x).toBeGreaterThan(0);
    expect(turned.y).toBeGreaterThan(0);
    expect(turned.x).not.toBeCloseTo(turned.y);
  });

  it("never turns back", () => {
    const angles = along(CHARGE_MS * 1.5).map((held) => spunTo(held).y);
    angles.forEach((angle, index) => {
      if (index > 0) expect(angle).toBeGreaterThan(angles[index - 1]);
    });
  });

  /**
   * The angle is the speed added up, and this checks it against a different
   * way of adding it up: a plain numeric sum over the same curve, which knows
   * nothing of how the closed form was derived. Get the integral wrong and the
   * dice jump the moment the speed changes.
   */
  it("is the speed added up over the time held", () => {
    const step = 1;
    let summed = 0;
    for (let held = 0; held < CHARGE_MS * 1.5; held += step) {
      summed += (spinSpeed(held + step / 2) * step) / 1000;
      // Checked every so often rather than every millisecond: the sum is what
      // has to run at the fine step, not the assertion. A tolerance in degrees,
      // against angles that run to five figures.
      if ((held + step) % 250 === 0) {
        expect(spunTo(held + step).y).toBeCloseTo(summed, 3);
      }
    }
  });

  it("keeps turning at full speed once the charge is full", () => {
    const full = spunTo(CHARGE_MS).y;
    const later = spunTo(CHARGE_MS + 1000).y;
    expect(later - full).toBeCloseTo(SPIN_MAX_DPS, 6);
  });
});

/**
 * Whose hold this device's hand is turning on, which is a different question
 * from whose hold the table reported. Two of the answers are `null` for
 * reasons that have nothing to do with the wind-up: a Roll on the table is the
 * dice, and a Player who asked for no movement is shown no movement — theirs
 * or anybody else's.
 */
describe("whether the hand in front of this device is turning", () => {
  const now = 1_700_000_000_000;
  const table = { seatIndex: 2, since: now - 3_000 };
  const hand = {
    still: false,
    thrown: false,
    mine: null,
    table: null,
    activeSeatIndex: 2,
  };

  it("turns on this device's own hold from the frame the thumb went down", () => {
    // Mine first: my own press is known here a round trip before the table's
    // answer about it comes back.
    expect(spinningSince({ ...hand, mine: now, table })).toBe(now);
  });

  it("turns on the hold the table reports, for a Player who is watching", () => {
    expect(spinningSince({ ...hand, table })).toBe(table.since);
  });

  it("stands still while a Roll is on the table", () => {
    // Those dice are the Roll and they are settling into the faces the server
    // chose. Nothing spins over them.
    expect(spinningSince({ ...hand, thrown: true, table })).toBe(null);
  });

  it("stands still for a hold by a Seat whose Turn it is not", () => {
    expect(spinningSince({ ...hand, table, activeSeatIndex: 0 })).toBe(null);
  });

  it("stands still for a watcher who asked for no movement", () => {
    // The one that is invisible from the phone that made the hold. Under
    // reduced motion a die renders as a static cube resting on the face it was
    // handed and says that face out loud, so a spinning hand becomes six
    // still 1s — a TUTTO nobody rolled, announced to a screen reader, off a
    // Roll the server has not even been asked for yet (ADR 0001).
    expect(spinningSince({ ...hand, still: true, table })).toBe(null);
    expect(spinningSince({ ...hand, still: true, mine: now, table })).toBe(
      null,
    );
  });
});

/**
 * Six dice and not one die drawn six times.
 *
 * Everything here reads the `transform` the cube actually wears, parsed back
 * out of `dieSpinTransform`, rather than a second copy of the arithmetic: the
 * claim is about what is on the screen, so what is on the screen is what is
 * sampled. The hand's shared angle comes from `spunTo`, which is what `useSpin`
 * writes onto the grid, so a sample here is a frame there.
 */
describe("a winding-up hand is six dice", () => {
  /** The rate and phase of each axis of one die, read off its transform. */
  const readTransform = (index: number) => {
    const spin = dieSpinTransform(index);
    const axis = (name: "rotateX" | "rotateY") => {
      const found = new RegExp(
        `${name}\\(calc\\(var\\(--spin-${name === "rotateX" ? "x" : "y"}, 0deg\\) \\* (-?[\\d.]+) \\+ (-?[\\d.]+)deg\\)\\)`,
      ).exec(spin);
      if (found === null) throw new Error(`no ${name} in "${spin}"`);
      return { rate: Number(found[1]), phase: Number(found[2]) };
    };
    return { x: axis("rotateX"), y: axis("rotateY") };
  };

  const hand = Array.from({ length: HAND }, (_, index) => readTransform(index));

  /** Where a die is pointing after a hold this long, from its own transform. */
  const pointing = (die: (typeof hand)[number], heldMs: number) => {
    const shared = spunTo(heldMs);
    return {
      x: shared.x * die.x.rate + die.x.phase,
      y: shared.y * die.y.rate + die.y.phase,
    };
  };

  /** How far apart two angles are, in degrees, the short way round. */
  const apart = (a: number, b: number) =>
    Math.abs(((((a - b) % 360) + 540) % 360) - 180);

  const pairs = hand.flatMap((_, i) =>
    hand.slice(i + 1).map((_, j) => [i, i + 1 + j] as const),
  );

  /**
   * The complaint this ticket names first: every die read the same pair of
   * angles, so all six presented the same corner at the same speed.
   *
   * Two dice look alike only when they agree on *both* axes, so that is what is
   * measured — and it is measured every millisecond of the whole charge, which
   * is longer than any Player will hold. Not for ever: rates that differ at all
   * bring two dice round to the same angle eventually, and rates that never
   * differ are the lockstep this is here to break. The charge is the window
   * that exists.
   */
  it("never has two dice at the same angle, the whole charge long", () => {
    let closest = Infinity;
    for (let held = 0; held <= CHARGE_MS; held += 1) {
      for (const [i, j] of pairs) {
        const a = pointing(hand[i], held);
        const b = pointing(hand[j], held);
        closest = Math.min(closest, Math.max(apart(a.x, b.x), apart(a.y, b.y)));
      }
    }
    expect(closest).toBeGreaterThan(20);
  });

  it("has them apart on the frame the thumb goes down", () => {
    // Rates alone would leave all six at the same angle at nought held, which
    // is the one frame every Player sees.
    for (const [i, j] of pairs) {
      const a = pointing(hand[i], 0);
      const b = pointing(hand[j], 0);
      expect(Math.max(apart(a.x, b.x), apart(a.y, b.y))).toBeGreaterThan(20);
    }
  });

  /**
   * A share of the hand's angle rather than a fixed addition to it, so the
   * spread is there at the resting speed and at the top of the charge alike.
   * Measured as a rate — the degrees a die covers over a tenth of a second —
   * at both ends.
   */
  it.each([
    ["the resting speed", 0],
    ["the top speed", CHARGE_MS],
  ])("turns every die at its own rate at %s", (_name, held) => {
    const rateOf = (die: (typeof hand)[number]) => {
      const from = pointing(die, held);
      const to = pointing(die, held + 100);
      return { x: to.x - from.x, y: to.y - from.y };
    };
    for (const [i, j] of pairs) {
      const a = rateOf(hand[i]);
      const b = rateOf(hand[j]);
      // Both axes differ, and by enough to see: 2% of the slower die.
      expect(Math.abs(a.x - b.x)).toBeGreaterThan(Math.abs(a.x) * 0.02);
      expect(Math.abs(a.y - b.y)).toBeGreaterThan(Math.abs(a.y) * 0.02);
    }
  });

  /**
   * The cost, which is the reason this is a `calc()` over two shared properties
   * and not six pairs of properties: `useSpin` writes two numbers a frame
   * however many dice are in hand, and each cube does its own arithmetic in the
   * compositor.
   */
  it("takes its variation off the two properties the hand shares", () => {
    for (let index = 0; index < HAND; index++) {
      const spin = dieSpinTransform(index);
      expect(spin).toContain("var(--spin-x, 0deg)");
      expect(spin).toContain("var(--spin-y, 0deg)");
      // No third property, so the frame loop has nothing more to write.
      expect(spin.match(/var\(/g)).toHaveLength(2);
    }
  });

  it("gives every phone at the table the same die", () => {
    // Derived from the place and from nothing else — no clock, no random
    // number, nothing a device could hold its own copy of (ADR 0001).
    for (let index = 0; index < HAND; index++) {
      expect(dieSpinTransform(index)).toBe(dieSpinTransform(index));
      expect(dieSpin(index)).toEqual(dieSpin(index));
    }
  });
});
