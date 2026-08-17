import { cardsLeft, fullDeck } from "./game/turn";

/**
 * How deep the played pile is. The Cards on it are public — every one of them
 * was watched arriving — but the position does not keep them: the Game holds
 * the deck as a count per Card and the Card in force, and nothing else
 * (ADR 0003). So the pile can say honestly how many Cards are on it and which
 * one is on top, and it cannot say which Cards are buried or in what order.
 * Nothing here invents that.
 *
 * The depth is the deck's own count subtracted from the box, which is the
 * number already printed on the pile beside it — so the played pile says
 * nothing about what is still to come that the deck was not already saying.
 * The per-Card counts are never read here, and that is the direction the rule
 * binds in.
 */

/** The whole box. Every Card out of it is a Card lying on the played pile. */
const DECK_SIZE = cardsLeft(fullDeck());

/**
 * Edges drawn under the top of the pile. A Game plays up to 56 Cards, and
 * fifty-odd rendered layers read as exactly the same pile three do — the call
 * the deck's own stack already makes, where the stack is always three layers
 * and the count beside it carries the truth.
 *
 * `.played-layer:nth-last-child` in `index.css` places three, and is the other
 * half of this number.
 */
const MAX_BURIED = 3;

/**
 * How many Cards are lying on the pile: every Card out of the box is on it, so
 * this is the deck's own count read the other way round. It is what a Card's
 * place in the pile is counted in — the newest Card landed at this number, the
 * one under it at one less.
 */
export const cardsPlayed = (left: number): number => DECK_SIZE - left;

/**
 * The angles Cards come to rest at, walked in order as the pile grows. A few
 * degrees either side of square: the pile should read as dealt, not scattered,
 * and an edge that swung further would reach across the printed line of the
 * Card lying on it.
 *
 * Nine of them, which is enough that no two Cards near each other in the pile
 * land at the same angle and short enough to read as a list of angles rather
 * than a table of data. Where it comes round again is fifty layers below
 * anything drawn.
 */
const TILTS = [2.5, -3.5, 5, -2, 4, -4.5, 1.5, -5, 3];

/**
 * The angle the Card that landed at this place in the pile lies at, in degrees.
 *
 * Derived and never drawn afresh: it is a fact about the position, so every
 * phone at the table draws the same pile, a re-render does not deal it again,
 * and a Card keeps the angle it landed at as the next Card settles on top of
 * it. The place is counted from the bottom of the pile rather than the top for
 * exactly that reason — counted from the top, every Card would turn under the
 * one landing on it.
 */
export const tiltOf = (place: number): number =>
  TILTS[Math.max(0, place) % TILTS.length];

/**
 * How many played Cards lie under the top of the pile.
 *
 * `inForce` says whether the Card in force is drawn face-up on top: it is the
 * newest Card on the pile, so it is not also one of the edges beneath itself.
 *
 * Drawing the 56th Card puts all 56 back, so a full deck and a Card in force
 * are true at the same moment: the pile has just been picked up and that Card
 * is the only thing on the new one. Hence the floor rather than a subtraction
 * that is allowed to go negative.
 */
export const buriedCards = (left: number, inForce: boolean): number =>
  Math.min(Math.max(DECK_SIZE - left - (inForce ? 1 : 0), 0), MAX_BURIED);

/**
 * Whether the pile has just been picked up, turned face-down and made the deck
 * again. Drawing the last Card of the box puts all 56 back, so a full deck with
 * a Card in force is the one position that can only have arrived that way — an
 * untouched deck has nothing face-up beside it, and every other draw leaves the
 * deck short.
 *
 * It is a fact about the Game and not about a device, so every Seat reads it off
 * the same subscription and watches the same pick-up. Counts and nothing else:
 * which Cards went back and in what order is not asked here, because there is no
 * such thing to ask (ADR 0003).
 */
export const pickedUp = (left: number, inForce: boolean): boolean =>
  inForce && left === DECK_SIZE;

/**
 * How deep the pile is the instant before it is picked up: the whole box lying
 * on it bar the one Card being drawn out of the deck. Capped like any other
 * pile, because fifty-odd edges read as three.
 */
export const PICKED_UP_DEPTH = buriedCards(1, false);
