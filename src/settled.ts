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
 * the same 800ms written where the rest of the app can read it. The one number
 * the app says twice, so the test beside this file reads that keyframe back and
 * compares it — raise one alone and »Niete!« lands on a table still moving.
 *
 * Back to 800, and the way it got here is worth keeping. It was 800 when a Roll
 * was a tap. The hold-to-charge throw arrived and it went to 1200, on the
 * argument that dice already turning when they are let go do not stop dead —
 * they come down. That argument named its own price in the same breath: a full
 * hand of six settling in 1500ms rather than 1100ms, and those 400ms spent on
 * every Roll of every Turn before the Player learns anything.
 *
 * The price turned out to be the part you feel. Played on a phone it read as
 * waiting, not as weight, so the judgement went the other way and the number
 * went back. The wind-up is what sells the throw; the landing does not have to
 * carry it too.
 *
 * The floor is not much below this. The hand is spread 150ms wide, so much
 * under 800 and the first die down is on the felt while the last is barely out
 * of the air, which reads as a stutter rather than as a hand of dice.
 *
 * The base of the flight rather than the length of any die's: `dieFlightMs`
 * builds each die's own length on it, and `Die.tsx` puts that length on each
 * die inline — so the keyframe's own duration is overridden on every die that
 * ever tumbles, and this number reaches the screen through `dieFlightMs` and
 * not through the stylesheet.
 *
 * The same length however long the Player held. `animationMs` answers from the
 * position and knows nothing of the wind-up, which is what lets a watching
 * phone — which never saw the hold — hold its news back for exactly as long as
 * the phone that threw them.
 */
export const TUMBLE_MS = 800;

/**
 * What a hand of six costs over a single die: `TUMBLE_MS + 5 × 60`, or 1100ms,
 * and that is what the news waits for.
 *
 * It was a stagger once — how much later than the one before it each die
 * *started* — and the name is the last of that. Since the dice began carrying
 * on from the speed the hold left them at (`throw.ts`) they all leave together,
 * because a die holding still until its slot came round would stop dead on the
 * frame the thumb came up. So this no longer staggers anything: it is the
 * padding that sets where the hand lands, and `STRETCH_MS` is what spreads the
 * six inside it. The spread they actually land across is 150ms, not this.
 *
 * Renaming it is the obvious tidy-up and is deliberately not done here: it is
 * exported, read by the CSS comment and by three tests, and this is not the
 * branch to move it in.
 */
export const STAGGER_MS = 60;

/** The seed a die of a Roll tumbles on: its place in the Roll, and its face. */
export const dieSeed = (index: number, face: Face): number => index * 7 + face;

/**
 * Which of the six places in the landing order a die takes.
 *
 * A permutation of the die's *place* and of nothing else, which is the whole
 * point: six dice therefore take six different places, always. It used to be
 * `(index + face) % 6`, and six dice into six places by way of the faces meant
 * pairs routinely landed together — the spread cancelling itself out on the
 * Rolls it was there for.
 *
 * Not the left-to-right order either, so the hand does not read as a wave
 * crossing it. The same order every Roll, and that is fine: what makes one Roll
 * unlike the next is the face each die is turning to, not which of them came
 * down first.
 */
const SLOTS = [0, 3, 1, 4, 2, 5];

/** Where in the landing order this die comes. */
export const dieSlot = (index: number): number =>
  SLOTS[((index % SLOTS.length) + SLOTS.length) % SLOTS.length];

/** How long a full hand takes to settle: the last die to come to rest. */
const HAND_MS = TUMBLE_MS + (SLOTS.length - 1) * STAGGER_MS;

/**
 * How much sooner each die lands than the one behind it.
 *
 * 30 and not 60, and the reason is the floor rather than the spread. Six dice
 * land 30ms apart at 950…1100ms. At 60 they would land 60ms apart at
 * 800…1100ms — still six distinct moments, so lockstep is not what rules it
 * out — but the first die would come down on the 800ms that `TUMBLE_MS`'s own
 * comment names as the floor, and it would get there having turned for the
 * shortest flight in the hand. 30 keeps every die clear of that.
 *
 * Subtracted from the hand's own figure rather than added to a die's, so six
 * distinct landings cost nothing: the last die still comes to rest at 1100ms,
 * and the price of buying them the other way — 150ms of waiting on every Roll
 * of every Turn — is the one the comment on `TUMBLE_MS` records being refused
 * already.
 */
export const STRETCH_MS = 30;

/**
 * How long one die is in the air.
 *
 * The six leave together and land apart. They used to do the opposite — each
 * die held still at its starting angle until its slot came round, and only then
 * began to turn — and that cannot stand beside a throw: a die carries on from
 * the speed the hold left it at (`throw.ts`), so a die holding still for up to
 * 300ms first would be a die stopping dead on the frame the thumb came up,
 * which is the very cut all of this was for. The slot is spent flying instead.
 *
 * What it bought is unchanged and is measured beside this file: six dice at six
 * moments, the first down at 950ms and the hand at 1100ms.
 */
export const dieFlightMs = (index: number): number =>
  HAND_MS - (SLOTS.length - 1 - dieSlot(index)) * STRETCH_MS;

/**
 * How long a Roll's tumble runs: the last die to come to rest. Each die is in
 * the air for its own length, so this is a maximum over the hand — a full hand
 * of six takes 1100ms to settle, as it did when they all turned for the same
 * 800.
 */
export const tumbleMs = (roll: readonly Face[]): number =>
  Math.max(0, ...roll.map((_, index) => dieFlightMs(index)));

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
