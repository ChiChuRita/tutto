import { describe, expect, it } from "vitest";
import {
  CHARGE_MS,
  HAND,
  SPIN_MAX_DPS,
  SPIN_MIN_DPS,
  dieSpin,
  dieSpinSpeed,
  dieSpinTransform,
  dieSpunTo,
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
  /**
   * The phase of each axis of one die, read off its transform.
   *
   * There is no rate to read any more: the hand shares one, so the `calc()` is
   * an addition and nothing else. Parsing it rather than trusting it is still
   * the point — a multiplier creeping back in here would be a die turning at
   * its own speed again, and this would stop matching.
   */
  const readTransform = (index: number) => {
    const spin = dieSpinTransform(index);
    const axis = (name: "rotateX" | "rotateY") => {
      const found = new RegExp(
        `${name}\\(calc\\(var\\(--spin-${name === "rotateX" ? "x" : "y"}, 0deg\\) \\+ (-?[\\d.]+)deg\\)\\)`,
      ).exec(spin);
      if (found === null) throw new Error(`no ${name} in "${spin}"`);
      return { phase: Number(found[1]) };
    };
    return { x: axis("rotateX"), y: axis("rotateY") };
  };

  const hand = Array.from({ length: HAND }, (_, index) => readTransform(index));

  /** Where a die is pointing after a hold this long, from its own transform. */
  const pointing = (die: (typeof hand)[number], heldMs: number) => {
    const shared = spunTo(heldMs);
    return {
      x: shared.x + die.x.phase,
      y: shared.y + die.y.phase,
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
   * One hand, one rate. Six things being shaken together move together; it was
   * 5% either side on X and 3% on Y, and it read as six dice of different
   * weights rather than as one hand.
   *
   * Measured as a rate — the degrees a die covers over a tenth of a second — at
   * the resting speed and at the top of the charge, because a rate difference
   * would show at one end even if it hid at the other.
   */
  it.each([
    ["the resting speed", 0],
    ["the top speed", CHARGE_MS],
  ])("turns every die at the same rate at %s", (_name, held) => {
    const rateOf = (die: (typeof hand)[number]) => {
      const from = pointing(die, held);
      const to = pointing(die, held + 100);
      return { x: to.x - from.x, y: to.y - from.y };
    };
    for (const [i, j] of pairs) {
      const a = rateOf(hand[i]);
      const b = rateOf(hand[j]);
      expect(a.x).toBeCloseTo(b.x, 6);
      expect(a.y).toBeCloseTo(b.y, 6);
    }
  });

  /**
   * What tells the dice apart once the rates are equal, and it is the whole of
   * it: a constant offset at one rate is a permanent one, so the gap two dice
   * are at on the frame the thumb goes down is the gap they keep. Nothing is
   * closing, so unlike the rate spread this cannot run out.
   */
  it("keeps every pair exactly as far apart as it started", () => {
    for (const [i, j] of pairs) {
      const atPress = Math.max(
        apart(pointing(hand[i], 0).x, pointing(hand[j], 0).x),
        apart(pointing(hand[i], 0).y, pointing(hand[j], 0).y),
      );
      for (const held of [1, 250, 1_000, CHARGE_MS, CHARGE_MS * 3]) {
        const a = pointing(hand[i], held);
        const b = pointing(hand[j], held);
        expect(Math.max(apart(a.x, b.x), apart(a.y, b.y))).toBeCloseTo(
          atPress,
          6,
        );
      }
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

/**
 * The angle the throw carries on from. Said twice — once as a `calc()` the
 * browser does and once as arithmetic `throw.ts` does — so this is what keeps
 * the two the same. A phase changed in one and not the other is a die that
 * jumps on the frame the thumb comes up, which is the whole thing `throw.ts`
 * exists to stop. It caught the rate the same way, back when there was one.
 */
describe("where a die of the hand is pointing", () => {
  /** The transform read back the way the browser would work it out. */
  const asDrawn = (index: number, heldMs: number) => {
    const spun = spunTo(heldMs);
    const read = (axis: "X" | "Y", shared: number) => {
      const found = new RegExp(
        `rotate${axis}\\(calc\\(var\\(--spin-[xy], 0deg\\) \\+ ([-\\d.]+)deg\\)\\)`,
      ).exec(dieSpinTransform(index));
      expect(found).not.toBeNull();
      return shared + Number(found?.[1]);
    };
    return { x: read("X", spun.x), y: read("Y", spun.y) };
  };

  it("is the same angle the cube is drawn at", () => {
    for (const index of [0, 1, 2, 3, 4, 5]) {
      for (const heldMs of [0, 120, 2_000, CHARGE_MS, CHARGE_MS * 2]) {
        const worked = dieSpunTo(heldMs, index);
        const drawn = asDrawn(index, heldMs);
        expect(worked.x).toBeCloseTo(drawn.x, 6);
        expect(worked.y).toBeCloseTo(drawn.y, 6);
      }
    }
  });

  it("turns at the speed the throw is handed", () => {
    // The speed is the angle's own derivative, so the two cannot disagree about
    // how fast the die was going when the thumb came up.
    const step = 0.02;
    for (const index of [0, 3, 5]) {
      for (const heldMs of [0, 900, 4_000, CHARGE_MS + 500]) {
        const turned = dieSpunTo(heldMs + step, index);
        const before = dieSpunTo(heldMs, index);
        const speed = dieSpinSpeed(heldMs);
        expect(((turned.y - before.y) * 1000) / step).toBeCloseTo(speed.y, 1);
        expect(((turned.x - before.x) * 1000) / step).toBeCloseTo(speed.x, 1);
      }
    }
  });
});
