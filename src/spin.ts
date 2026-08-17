/**
 * The wind-up: how fast the dice are turning while »Würfeln« is held down, and
 * how far they have turned by now.
 *
 * Nothing here decides anything. The spin runs before the mutation does — there
 * is no Roll yet, the dice are turning on nothing, and the server picks the
 * faces on release from exactly the source it always has (ADR 0001). That is
 * why this module answers only in degrees: there is no charge level in it,
 * because there is no charge. A number the screen could print — a meter, a
 * fill, a colour going from cold to hot — would say that winding up harder
 * rolls better, and in a push-your-luck game that belief is poisonous. Speed is
 * the only thing the hold is allowed to change, and speed is all this returns.
 *
 * The settle after the release is a different thing entirely and lives in
 * `settled.ts`: that one *is* a replay of a decided Roll, the whole screen
 * waits for it, and it is the same length whether the Player held for ten
 * seconds or tapped. It has to be — `animationMs` is pure in the position, so a
 * settle that varied with the hold could not be known to a watching phone,
 * which never saw the hold at all.
 */

import type { WindUp } from "./presence";

/**
 * How long a hold takes to reach full speed. Ten seconds is far longer than
 * anybody will hold it twice, and that is the point: the ceiling is out past
 * where a Player will go, so the spin is still gaining whenever they let go and
 * a hold never feels finished before they meant it to.
 */
export const CHARGE_MS = 10_000;

/**
 * Degrees a second at the moment of the press — half a turn. Slow, but never
 * stopped: a cube resting on a readable face for even a moment is a face a
 * Player could take for a result, and the dice have not been thrown yet.
 */
export const SPIN_MIN_DPS = 180;

/** Degrees a second at the top: four turns, which is past reading a face. */
export const SPIN_MAX_DPS = 1440;

/**
 * How much of the turn the other axis takes. Not a round fraction and not one
 * the two axes share a period with, so the cube keeps presenting new corners
 * instead of settling into a repeating wobble — the difference between a
 * tumbling die and a spinning wheel.
 */
export const SPIN_TILT = 0.61;

/** How far into the charge a hold of `heldMs` is, from 0 to 1. */
const charged = (heldMs: number): number =>
  Math.min(Math.max(heldMs, 0) / CHARGE_MS, 1);

/**
 * Degrees a second, for a hold this long.
 *
 * Eased out rather than ramped straight: most of the range is gained in the
 * first seconds, because the first seconds are the only ones most Players will
 * ever use. A straight ramp puts a two-second hold a fifth of the way up, which
 * reads as nothing happening; this puts it past a third.
 */
export const spinSpeed = (heldMs: number): number => {
  const left = 1 - charged(heldMs);
  return SPIN_MAX_DPS - (SPIN_MAX_DPS - SPIN_MIN_DPS) * left * left;
};

/**
 * Where the dice are pointing, for a hold this long: the speed above added up.
 *
 * Added up in closed form rather than accumulated frame by frame, so the angle
 * is a function of the hold and of nothing else. A frame the browser drops, a
 * tab that goes to the background and comes back, a phone that stalls on the
 * mutation — none of them can leave the dice at an angle that depends on how
 * the last few seconds happened to be scheduled. It also means the spin can be
 * started from a timestamp and read at any moment, which is exactly what a
 * watching phone does with a hold it never made.
 */
export const spunTo = (heldMs: number): { x: number; y: number } => {
  const u = charged(heldMs);
  const left = 1 - u;
  // The integral of the eased speed over the charge, in degrees…
  const rising =
    (CHARGE_MS / 1000) *
    (SPIN_MAX_DPS * u -
      ((SPIN_MAX_DPS - SPIN_MIN_DPS) * (1 - left * left * left)) / 3);
  // …and flat out for whatever the Player went on holding after that.
  const over = Math.max(0, Math.max(heldMs, 0) - CHARGE_MS);
  const y = rising + (SPIN_MAX_DPS * over) / 1000;
  return { x: y * SPIN_TILT, y };
};

/**
 * When the dice in front of *this* device started turning, or `null` for a hand
 * standing still. The question the hand slots are drawn from, and the one the
 * angle above is read at.
 *
 * Two of the answers have nothing to do with the wind-up. A Roll on the table
 * is the dice, settling into the faces the server chose, and nothing spins over
 * them. And a Player who asked for no movement is shown none — not their own,
 * which they cannot start, and not a table-mate's either.
 *
 * That last one is the whole reason this is a function and not an `??`. A hold
 * is somebody else's gesture arriving over the subscription, so the reduced
 * motion it has to answer to is the *watcher's*, and the watcher's screen is
 * the one place the phone that made the hold can never see. Left ungated, a
 * spinning hand under `prefers-reduced-motion` is six cubes that do not spin:
 * each rests on the face it was handed and says that face out loud to a screen
 * reader. Six of anything is a Tutto, and there is no Roll — the server has not
 * been asked for one yet (ADR 0001). So the dashed places stay, which is what a
 * Player with reduced motion saw before the hold existed and exactly what
 * ticket 15 asks for.
 */
export const spinningSince = ({
  still,
  thrown,
  mine,
  table,
  activeSeatIndex,
}: {
  /** This Player has asked for no movement. */
  still: boolean;
  /** A Roll is on the table. */
  thrown: boolean;
  /**
   * This device's own hold, which is known from the frame the thumb goes down —
   * so it is preferred, the table's answer about it being a round trip away.
   */
  mine: number | null;
  /** The hold the table is reporting, from `windingUp`. */
  table: WindUp | null;
  activeSeatIndex: number;
}): number | null => {
  if (still || thrown) return null;
  if (mine !== null) return mine;
  // Only the Seat whose Turn it is can be rolling. The server refuses to record
  // anyone else's hold; this is the screen refusing to draw one.
  return table !== null && table.seatIndex === activeSeatIndex
    ? table.since
    : null;
};
