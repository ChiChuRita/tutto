import { describe, expect, it } from "vitest";
import {
  CHARGE_MS,
  SPIN_MAX_DPS,
  SPIN_MIN_DPS,
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
