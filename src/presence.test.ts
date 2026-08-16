import { describe, expect, it } from "vitest";
import { PRESENT_WITHIN_MS, presentSeats } from "./presence";

/**
 * Presence is one question — has this Seat's device said anything lately — so
 * the whole seam is a list of check-ins and a clock. The cases worth pinning
 * are the two sides of the threshold and the Seat that has never checked in at
 * all, because that is what every Seat looks like the moment a Game starts.
 */

const now = 1_700_000_000_000;

describe("which Seats count as present", () => {
  it("counts a Seat that checked in just now", () => {
    const present = presentSeats(
      [{ seatIndex: 0, lastSeen: now - 1_000 }],
      now,
    );
    expect(present.has(0)).toBe(true);
  });

  it("counts a Seat that has gone quiet for longer than the threshold as away", () => {
    const quiet = now - PRESENT_WITHIN_MS - 1;
    const present = presentSeats([{ seatIndex: 1, lastSeen: quiet }], now);
    expect(present.has(1)).toBe(false);
  });

  it("still counts a Seat one heartbeat late, so a slow phone is not away", () => {
    // The device checks in every 10s; a missed beat must not read as gone.
    const late = now - 20_000;
    expect(presentSeats([{ seatIndex: 0, lastSeen: late }], now).has(0)).toBe(
      true,
    );
  });

  it("treats a Seat that has never checked in as away", () => {
    expect(presentSeats([], now).has(0)).toBe(false);
  });

  it("answers for each Seat separately", () => {
    const present = presentSeats(
      [
        { seatIndex: 0, lastSeen: now - 5_000 },
        { seatIndex: 2, lastSeen: now - 60_000 },
      ],
      now,
    );
    expect([...present]).toEqual([0]);
  });
});
