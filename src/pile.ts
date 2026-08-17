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
