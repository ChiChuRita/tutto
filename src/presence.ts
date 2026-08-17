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

/**
 * How long a wind-up counts for on a watching phone.
 *
 * A hold is said once, when the thumb goes down, and never said again while it
 * lasts. It cannot be: the row carries the moment of the press and the watching
 * dice are turned from it, so a second word would have to either repeat that
 * moment or replace it — and replacing it snaps every watching phone's dice
 * back to the resting speed, which is the whole of what a repeat was for.
 *
 * So this window is the only thing holding a watcher's dice up, and it is sized
 * to outlast a hold rather than to outlast a lost message: the ten seconds the
 * charge runs for (`spin.ts`), the Roll's round trip after it, and room for a
 * Player who leans on the button past full speed. It is also the only thing
 * that ever ends a wind-up nobody ended — a phone that locked or closed
 * mid-hold sends no last word, and the alternative to a threshold is a table
 * spinning for the rest of the Game.
 *
 * The ceiling that comes with the trade: a hold longer than this stops the
 * watching table's dice under a thumb still pressing. Nothing is gained past
 * the charge, so what stops is a spin that had nothing left to say — and the
 * upgrade path, if a Player is ever seen to hold that long, is a second field
 * on the row saying the hold is still on, leaving the press time alone.
 *
 * In the ordinary case nothing waits for this at all: the Roll arrives, the
 * real dice mount, and the spin is over because there is something better to
 * show.
 */
export const WINDING_FOR_MS = 15_000;

/** One Seat's last word, as the server recorded it. */
export type CheckIn = {
  /** The Seat's place in the Game's `seats`. */
  seatIndex: number;
  lastSeen: number;
  /**
   * When that Seat's thumb went down on »Würfeln«, or absent for a Seat that
   * has never rolled from this table. The moment of the press and not the
   * moment it was last mentioned: it is written once, when the hold starts, and
   * is left alone until the hold is over.
   *
   * A time and not a level: how long the hold has run decides nothing
   * (ADR 0001), so there is nothing about it worth sending to anybody else.
   */
  rollingSince?: number;
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

/** A hold in progress: whose it is, and when the thumb went down. */
export type WindUp = {
  seatIndex: number;
  /**
   * When the hold started. The dice are turned from this rather than from the
   * moment this phone noticed, so every screen at the table shows the same
   * wind-up at the same speed — and a dropped frame or a tab coming back from
   * the background cannot leave one of them turning at its own angle.
   *
   * It is still not a charge level, and it is not shown as one: `spin.ts` turns
   * it into degrees a second and there is nothing else it can be turned into.
   */
  since: number;
};

/**
 * The hold running at `now`, or `null` for a table where nobody is winding up.
 * A watching phone shows that Seat's dice turning, so the wait through a long
 * hold is a Player visibly winding up rather than a screen gone quiet.
 *
 * The clock is the client's here for the same reason it is above, and it is the
 * same trade written down in ADR 0006: a threshold applied inside the query
 * would be computed once and then frozen, and it would freeze hardest in the
 * case it exists for — the phone that stopped saying anything.
 *
 * Every Seat that has ever rolled leaves a `rollingSince` behind in its row, so
 * most of what arrives here is old news; the newest fresh one is the answer,
 * rather than the first the query happened to return. Only the Seat whose Turn
 * it is can roll, so two at once should not arise — but an answer that depends
 * on row order is not an answer.
 */
export const windingUp = (
  checkIns: readonly CheckIn[],
  now: number,
): WindUp | null =>
  checkIns.reduce<WindUp | null>((winding, { seatIndex, rollingSince }) => {
    if (rollingSince === undefined || now - rollingSince > WINDING_FOR_MS) {
      return winding;
    }
    // A hold timed from a clock running ahead of this one still counts: the
    // alternative is dropping a wind-up that is really happening, and `spunTo`
    // reads a hold that has not started yet as one that has turned nowhere.
    return winding === null || rollingSince > winding.since
      ? { seatIndex, since: rollingSince }
      : winding;
  }, null);
