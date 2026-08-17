import { cardInForce, cardOnTop } from "./cards";
import { cardsLeft, type Face, type GameState } from "./game/turn";
import { pickedUp } from "./pile";

/**
 * How long the screen is still moving. Every animation on the play screen is a
 * replay of something the server has already decided (ADR 0001), so how long it
 * runs is a question about the position and nothing else — no rendering, no
 * clock, no element to measure. That makes it a pure function, and this is the
 * one place the app answers it.
 *
 * Every duration the answer is made of lives here, in whole milliseconds. Three
 * of them are said in CSS — a keyframe, a per-die delay and the deck's refill
 * transition — which cannot be written in the library's seconds at all; and the
 * sum is compared against a clock and named in tests, where 380 has to mean
 * 380. So the milliseconds are the number and
 * `motion.ts` — still the one motion vocabulary the elements animate from —
 * divides for the two it hands to the library, rather than restating them.
 */

/**
 * The dice tumble, as `.die-tumbling` plays it. The keyframe lives in
 * `index.css` because a `preserve-3d` cube belongs on the compositor; this is
 * the same 1200ms written where the rest of the app can read it. The one number
 * the app says twice, so the test beside this file reads that keyframe back and
 * compares it — raise one alone and »Niete!« lands on a table still moving.
 *
 * It was 800ms, when a Roll was a tap and the dice went straight from standing
 * still to their faces. They are thrown now — »Würfeln« is held down and the
 * cubes are already turning when it is let go (`spin.ts`) — and dice with that
 * much going do not stop in 800ms, they come down. 1200 is what that costs: a
 * full hand of six settles in 1500ms rather than 1100ms, and those 400ms are
 * spent on every Roll of every Turn before the Player learns anything. That is
 * the whole argument against going further. 1600 would put a hand of six at
 * 1.9s, which is long enough to reach for the next tap before the table has
 * finished answering the last one; 1200 is heavier than the flick was and still
 * inside the beat a Player waits without noticing they are waiting.
 *
 * The same length however long the Player held. `animationMs` answers from the
 * position and knows nothing of the wind-up, which is what lets a watching
 * phone — which never saw the hold — hold its news back for exactly as long as
 * the phone that threw them.
 */
export const TUMBLE_MS = 1200;

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
 * 300ms of stagger, so a full hand of six takes 1500ms to settle.
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

/**
 * A flight: the drawn Card off the pile into its place, a die out of the hand
 * down into »Herausgelegt«. One number and not one each — the distances differ,
 * the gesture does not, and two lanes that each invented a flight landed 50ms
 * apart under the same name, a difference nobody chose and nobody could see.
 * `motion.ts` carries that argument, and the reason to split them again belongs
 * there with it.
 */
export const FLIGHT_MS = 400;

/** The drawn Card turning face-up, once its flight has landed. */
export const FLIP_MS = 380;

/** The whole draw: off the pile, then face-up. */
export const DRAW_MS = FLIGHT_MS + FLIP_MS;

/**
 * The played pile being picked up, turned face-down and set on the deck it has
 * just become.
 *
 * Its own number rather than the flight's 400, which is the split `FLIGHT_MS`
 * says to make here with the reason attached. The reason: a flight is a beat the
 * Player is meant to watch, and this is a flourish in front of a Card they have
 * already asked for — every millisecond of it is a Player waiting mid-Turn. So
 * it is the quicker of the two, by a quarter, which is a gap you can see.
 *
 * The other number the app says twice, alongside `TUMBLE_MS`. `--deck-refill`
 * on `.card-stack` in `index.css` is this same 300ms: the deck's edges slide
 * out from under its top card for exactly as long as the pile is in the air, so
 * the pick-up leaves a full deck rather than arriving at one. A transition
 * cannot import a constant either, so the test beside this file reads that rule
 * back and compares it — and checks that `.card-stack-settling` still applies
 * it, since that class is both the reduced-motion gate and the only thing that
 * makes the edges move at all.
 */
export const PICKUP_MS = 300;

/**
 * The Card on top of the played pile, keyed exactly as the pile keys it, and
 * `""` for a pile with nothing on it. Which Card that is is `cardOnTop` and not
 * a second copy of the rule here, because mounting that element is what plays
 * the draw: the news the flip delivers has to arrive on the frame this key says
 * it may, and two rules could not promise that. Every draw takes one Card out
 * of the deck, so the count is what makes each draw its own.
 *
 * It is the top of the pile and not the Card in force, so a TUTTO — which
 * spends its Card without moving it — does not read as a draw and start a
 * flight nothing is flying.
 */
const cardKey = (state: GameState): string => {
  const card = cardOnTop(state.turn, state.lastCard);
  return card === null ? "" : `${card}-${cardsLeft(state.deck)}`;
};

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
  const faceUp = cardKey(after) !== "";
  if (faceUp && cardKey(after) !== keyOf(before, cardKey)) {
    // Fetching the last Card of the box empties the deck, so the pile has to go
    // back on it first — and the Card cannot come off a deck that is not there
    // yet. Two beats end to end, and the news is owed to the second.
    //
    // A Card in force and not the face on top, which is what `faceUp` above
    // says: the full deck outlasts the Turn that emptied it. Nothing forces the
    // next Player to draw (ADR 0005), so the deck can stand at 56 for days with
    // the last Card played still lying face-up — and a phone opening into that
    // window would replay a pick-up that finished long ago, holding its news
    // 300ms longer than the phone beside it.
    //
    // The sum is a frame or two short of what the eye sees, and only here. It
    // assumes the flight starts on the frame the pick-up ends, where in fact a
    // React round-trip sits between them — the pick-up reports it has finished,
    // that becomes state, the Card mounts, measures itself in a layout effect
    // and only then animates. Call it 16-32ms, so on a reshuffle the news lands
    // during the last frames of the flip rather than just after it. Nobody is
    // owed a fix for that; nobody should treat this number as exact either.
    playing.push(
      pickedUp(cardsLeft(after.deck), cardInForce(after.turn) !== null)
        ? PICKUP_MS + DRAW_MS
        : DRAW_MS,
    );
  }
  // Only a row that has grown: a TUTTO and a Niete empty it, and nothing flies
  // back out of it. A screen that has just opened has no hand to fly from
  // either, so the dice already in the row are simply there.
  if (
    before !== null &&
    after.turn.setAside.length > before.turn.setAside.length
  ) {
    playing.push(FLIGHT_MS);
  }
  return Math.max(...playing);
}

/** What a position was keyed on before, or `""` for a screen with no before. */
const keyOf = (
  state: GameState | null,
  key: (state: GameState) => string,
): string => (state === null ? "" : key(state));
