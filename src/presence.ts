/**
 * Who still has the Game open. A seated device says "still here" every so
 * often; a Seat whose last word is recent is present, and one whose word has
 * gone stale is away. That is the whole vocabulary — there is no "last seen 20
 * minutes ago", because nothing is done with the answer beyond telling a
 * waiting Player whether anyone is going to move.
 *
 * A check-in is never written onto the Game document: every device at the
 * table subscribes to that document, so a timestamp landing in it three times
 * a minute would re-render every phone and interleave with real moves. The
 * check-ins live in their own table, and this module is the only place that
 * turns them into present-or-away.
 */

/** How often a device with a Seat says it is still here. */
export const HEARTBEAT_MS = 10_000;

/**
 * How long a Seat's last check-in counts for. Three heartbeats: a phone that
 * misses one to a slow network must not blink out of the table, and half a
 * minute of silence is late enough that "away" means something.
 */
export const PRESENT_WITHIN_MS = 30_000;

/** One Seat's last word, as the server recorded it. */
export type CheckIn = {
  /** The Seat's place in the Game's `seats`. */
  seatIndex: number;
  lastSeen: number;
};

/**
 * The Seats counting as present at `now`. A Seat with no check-in at all is
 * simply absent from the answer — a Game that has just started looks exactly
 * like one everybody has left, and neither of them is anything to shout about.
 */
export const presentSeats = (
  checkIns: readonly CheckIn[],
  now: number,
): ReadonlySet<number> =>
  new Set(
    checkIns
      .filter((checkIn) => now - checkIn.lastSeen <= PRESENT_WITHIN_MS)
      .map((checkIn) => checkIn.seatIndex),
  );
