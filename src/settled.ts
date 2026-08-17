import { cardsLeft, type Face, type GameState } from "./game/turn";

/**
 * How long the screen is still moving. Every animation on the play screen is a
 * replay of something the server has already decided (ADR 0001), so how long it
 * runs is a question about the position and nothing else — no rendering, no
 * clock, no element to measure. That makes it a pure function, and this is the
 * one place the app answers it.
 */

/**
 * The dice tumble, as `.die-tumbling` plays it. The keyframe lives in
 * `index.css` because a `preserve-3d` cube belongs on the compositor; this is
 * the same 800ms written where the rest of the app can read it, and the test
 * beside this file is what keeps the two honest.
 */
export const TUMBLE_MS = 800;

/**
 * How much later each die starts than the one before it, so a Roll lands as six
 * dice rather than one six-sided noise. Six places, then it comes round again.
 */
export const STAGGER_MS = 60;

/** The seed a die of a Roll tumbles on: its place in the Roll, and its face. */
export const dieSeed = (index: number, face: Face): number => index * 7 + face;

/** How long a die waits before it starts. */
export const dieDelayMs = (seed: number): number => (seed % 6) * STAGGER_MS;

/**
 * How long a Roll's tumble runs: the last die to start, plus its tumble. Up to
 * 300ms of stagger, so a full hand of six takes 1100ms to settle.
 */
export const tumbleMs = (roll: readonly Face[]): number =>
  TUMBLE_MS +
  Math.max(0, ...roll.map((face, index) => dieDelayMs(dieSeed(index, face))));

/**
 * The Roll on the table, keyed exactly as the dice grid keys it, and `""` for
 * a table with no dice on it. Mounting a fresh set of dice is what plays the
 * tumble, so what counts as a new Roll here is what counts as one there — one
 * mechanism, not a second one that could disagree with it.
 */
const rollKey = (state: GameState): string => state.turn.roll?.join("") ?? "";

/** A die's flight out of the hand and down into »Herausgelegt«. */
export const SET_ASIDE_MS = 350;

/** The drawn Card's flight off the pile, and so how long its flip waits. */
export const CARD_FLIGHT_MS = 400;
export const CARD_FLIP_MS = 380;

/** The whole draw: off the pile, then face-up. */
export const DRAW_MS = CARD_FLIGHT_MS + CARD_FLIP_MS;

/**
 * The Card in the slot, keyed exactly as the slot keys it, and `""` for a slot
 * standing empty. A Card owed is a Card gone, so a Turn waiting on one has no
 * Card however much the position still carries; and every draw takes one Card
 * out of the deck, so the count is what makes each draw its own.
 */
const cardKey = (state: GameState): string =>
  state.turn.phase === "awaitingCard" || state.turn.card === null
    ? ""
    : `${state.turn.card}-${cardsLeft(state.deck)}`;

/**
 * How long the animations that the move from `before` to `after` starts will
 * run, in milliseconds. `null` for `before` is a screen that has just opened:
 * every animation on it plays from its own first frame, which is why a reload
 * mid-Roll replays the tumble.
 *
 * Several can start at once — a phone that opens on a Turn already in progress
 * mounts the Card and the dice together — so the answer is the longest of them.
 */
export function animationMs(
  before: GameState | null,
  after: GameState,
  /** The Player has asked for no movement, so there is nothing to wait for. */
  still: boolean,
): number {
  if (still) return 0;
  const playing = [0];
  if (after.turn.roll !== null && rollKey(after) !== keyOf(before, rollKey)) {
    playing.push(tumbleMs(after.turn.roll));
  }
  if (cardKey(after) !== "" && cardKey(after) !== keyOf(before, cardKey)) {
    playing.push(DRAW_MS);
  }
  // Only a row that has grown: a TUTTO and a Niete empty it, and nothing flies
  // back out of it. A screen that has just opened has no hand to fly from
  // either, so the dice already in the row are simply there.
  if (
    before !== null &&
    after.turn.setAside.length > before.turn.setAside.length
  ) {
    playing.push(SET_ASIDE_MS);
  }
  return Math.max(...playing);
}

/** What a position was keyed on before, or `""` for a screen with no before. */
const keyOf = (
  state: GameState | null,
  key: (state: GameState) => string,
): string => (state === null ? "" : key(state));
