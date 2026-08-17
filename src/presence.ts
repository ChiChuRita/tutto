/**
 * Who still has the Game open. A seated device says "still here" every so
 * often; a Seat whose last word is recent is present, and one whose word has
 * gone stale is away. That is nearly the whole vocabulary — there is no "last
 * seen 20 minutes ago", because nothing is done with the answer beyond telling
 * a waiting Player whether anyone is going to move. The one addition is *not
 * yet known*, for a device that has only just opened the Game and has heard
 * nothing from anybody, itself included.
 *
 * A check-in is never written onto the Game document: every device at the
 * table subscribes to that document, so a timestamp landing in it three times
 * a minute would re-render every phone and interleave with real moves. The
 * check-ins live in their own table — the one row every piece of transient
 * per-Seat state goes on — and this module is the only place that turns them
 * into present-or-away. What the same row says about the dice is
 * `selection.ts`; the two share a row and a subscription and nothing else.
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
 * What one Seat's dot says: here, gone, or `null` for a Seat this device has
 * had no chance to hear from yet. Not yet known is not away, and it is drawn as
 * nothing rather than as an empty ring.
 */
export type Presence = boolean | null;

/** The answer for every Seat in the Game, asked one Seat at a time. */
export type SeatPresence = (seatIndex: number) => Presence;

/**
 * How long this device has to listen before silence from a Seat is the Seat's
 * silence rather than its own ignorance. One heartbeat: a device with the Game
 * open checks in that often and does so the moment it opens, so anybody who is
 * here has said so within one.
 *
 * Without this the Game you have just opened tells you *you* are away — the
 * check-ins query answers well before the check-in this device sent on opening
 * comes back, so your own Seat is missing from it, or is still showing the word
 * it left yesterday.
 */
const LISTEN_MS = HEARTBEAT_MS;

/**
 * Present-or-away for every Seat at `now`, as far as this device can tell.
 *
 * Silence is the ambiguous case and the only one arrival changes: a Seat with a
 * recent check-in is here and is reported here immediately, because that is
 * news already and waiting on it would hide something known.
 */
export const seatPresence = (
  checkIns: readonly CheckIn[],
  now: number,
  /** When this device started watching this Game. */
  watchingSince: number,
): SeatPresence => {
  const lastSeen = new Map(
    checkIns.map((checkIn) => [checkIn.seatIndex, checkIn.lastSeen]),
  );
  const listened = now - watchingSince >= LISTEN_MS;
  return (seatIndex) => {
    const seen = lastSeen.get(seatIndex);
    if (seen !== undefined && now - seen <= PRESENT_WITHIN_MS) return true;
    return listened ? false : null;
  };
};
