import { describe, expect, it } from "vitest";
import {
  HEARTBEAT_MS,
  PRESENT_WITHIN_MS,
  WINDING_FOR_MS,
  seatPresence,
  windingUp,
} from "./presence";
import { CHARGE_MS } from "./spin";

/**
 * Presence is one question — has this Seat's device said anything lately — but
 * it has three answers, not two. The third is "no idea yet", and it is the one
 * worth pinning: a device that has only just opened the Game has heard nothing
 * from anybody, including itself, and nothing is not the same as gone.
 */

const now = 1_700_000_000_000;

/** Long enough that anybody with the Game open would have checked in by now. */
const listening = now - HEARTBEAT_MS;

/** This device opened the Game a moment ago and has heard nothing back yet. */
const justOpened = now;

describe("what a Seat's dot says", () => {
  it("counts a Seat that checked in just now as present", () => {
    const present = seatPresence(
      [{ seatIndex: 0, lastSeen: now - 1_000 }],
      now,
      listening,
    );
    expect(present(0)).toBe(true);
  });

  it("counts a Seat gone quiet for longer than the threshold as away", () => {
    const quiet = now - PRESENT_WITHIN_MS - 1;
    const present = seatPresence(
      [{ seatIndex: 1, lastSeen: quiet }],
      now,
      listening,
    );
    expect(present(1)).toBe(false);
  });

  it("still counts a Seat one heartbeat late, so a slow phone is not away", () => {
    // The device checks in every 10s; a missed beat must not read as gone.
    const late = now - 20_000;
    const present = seatPresence(
      [{ seatIndex: 0, lastSeen: late }],
      now,
      listening,
    );
    expect(present(0)).toBe(true);
  });

  it("counts a Seat that has never checked in as away, once it has had a chance", () => {
    expect(seatPresence([], now, listening)(0)).toBe(false);
  });

  it("answers for each Seat separately", () => {
    const present = seatPresence(
      [
        { seatIndex: 0, lastSeen: now - 5_000 },
        { seatIndex: 2, lastSeen: now - 60_000 },
      ],
      now,
      listening,
    );
    expect([present(0), present(1), present(2)]).toEqual([true, false, false]);
  });
});

describe("a Game this device has only just opened", () => {
  it("says nothing about a Seat it has had no chance to hear from", () => {
    // Not away — unknown. The dot is absent rather than hollow.
    expect(seatPresence([], now, justOpened)(0)).toBe(null);
  });

  it("does not call your own Seat away while your first check-in is in flight", () => {
    // The check-ins query answers before the check-in this device sent on
    // opening comes back, so your own row is missing or left over from an
    // earlier session. Either way it is not news that you have gone.
    const yesterday = now - 86_400_000;
    const mine = seatPresence(
      [{ seatIndex: 0, lastSeen: yesterday }],
      now,
      justOpened,
    );
    expect(mine(0)).toBe(null);
  });

  it("still reports a Seat that is plainly here, arrival or not", () => {
    // Silence is what arrival casts doubt on. A recent check-in is an answer
    // already, so waiting on it would hide something known.
    const present = seatPresence(
      [{ seatIndex: 1, lastSeen: now - 2_000 }],
      now,
      justOpened,
    );
    expect(present(1)).toBe(true);
  });

  it("turns unknown into away once the listening window has passed", () => {
    const opened = now - HEARTBEAT_MS;
    expect(seatPresence([], now - 1, opened)(0)).toBe(null);
    expect(seatPresence([], now, opened)(0)).toBe(false);
  });
});

/**
 * A watching phone sees the dice turning while the Seat whose Turn it is holds
 * »Würfeln« down. Without it a ten-second hold is ten seconds of a screen that
 * says nothing at all, which reads as the Game having stopped.
 *
 * What it sees is *that* they are winding up and never how far — there is no
 * how-far to see. The hold changes no odds (ADR 0001 puts the faces on the
 * server, chosen on release), so a charge level shown to a table-mate would be
 * a number about nothing.
 */
describe("who is winding up to roll", () => {
  it("names a Seat that has just said it is holding", () => {
    expect(
      windingUp(
        [{ seatIndex: 1, lastSeen: now, rollingSince: now - 500 }],
        now,
      ),
    ).toEqual({ seatIndex: 1, since: now - 500 });
  });

  it("names nobody when nobody is holding", () => {
    expect(windingUp([], now)).toBe(null);
    expect(windingUp([{ seatIndex: 0, lastSeen: now }], now)).toBe(null);
  });

  it("lets go of a hold nothing has been heard from for too long", () => {
    // The phone that was holding went away mid-wind-up — a locked screen, a
    // closed tab, a dead battery. Nothing will ever arrive to say it stopped,
    // so the watching table must be able to stop on its own rather than spin
    // for the rest of the Game.
    const abandoned = now - WINDING_FOR_MS - 1;
    expect(
      windingUp(
        [{ seatIndex: 1, lastSeen: now, rollingSince: abandoned }],
        now,
      ),
    ).toBe(null);
  });

  it("times a hold from the press and from nothing said since", () => {
    // The moment the thumb went down, and it never moves while the thumb is
    // down: `spunTo` reads the angle straight off it, so a wind-up retimed
    // mid-hold would snap the watching table's dice back and drop them to the
    // resting speed. The press is written once and nothing rewrites it.
    const pressed = now - 8_000;
    expect(
      windingUp([{ seatIndex: 1, lastSeen: now, rollingSince: pressed }], now),
    ).toEqual({ seatIndex: 1, since: pressed });
  });

  it("holds on past the end of the charge, for a thumb still leaning on it", () => {
    // Nothing is said about the hold after the press, so this window is the
    // whole of what keeps a watching table's dice turning. It has to outlast
    // the charge with the throw's round trip to spare — and a Player who goes
    // on holding past full speed, which gains them nothing but which people do.
    const leaning = now - CHARGE_MS - 2_500;
    expect(
      windingUp([{ seatIndex: 1, lastSeen: now, rollingSince: leaning }], now),
    ).toEqual({ seatIndex: 1, since: leaning });
  });

  it("ignores the wind-up that was left over from an earlier Turn", () => {
    // A Seat's row keeps the last time that Seat wound up, so every Seat that
    // has ever rolled has a stale one sitting there. Only the fresh one is a
    // Player with their thumb down right now.
    const seat = windingUp(
      [
        { seatIndex: 0, lastSeen: now, rollingSince: now - 400_000 },
        { seatIndex: 2, lastSeen: now, rollingSince: now - 1_000 },
      ],
      now,
    );
    expect(seat).toEqual({ seatIndex: 2, since: now - 1_000 });
  });

  it("takes the newest hold when two rows are both fresh", () => {
    // Only the Seat whose Turn it is can roll, so this should not arise — but
    // an answer that depends on the order rows come back in is not an answer.
    const seat = windingUp(
      [
        { seatIndex: 0, lastSeen: now, rollingSince: now - 3_000 },
        { seatIndex: 3, lastSeen: now, rollingSince: now - 200 },
      ],
      now,
    );
    expect(seat).toEqual({ seatIndex: 3, since: now - 200 });
  });
});
