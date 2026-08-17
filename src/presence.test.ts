import { describe, expect, it } from "vitest";
import { HEARTBEAT_MS, PRESENT_WITHIN_MS, seatPresence } from "./presence";

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
