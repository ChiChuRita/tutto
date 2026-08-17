import { cardsLeft, fullDeck } from "./game/turn";

/**
 * How deep the played pile is. The Cards on it are public — every one of them
 * was watched arriving — but the position does not keep them: the Game holds
 * the deck as a count per Card, the Card the Turn is holding and the one played
 * before it, and nothing else (ADR 0007). So the pile can say honestly how many
 * Cards are on it and which its top two faces are, and it cannot say which
 * Cards are buried under those or in what order. Nothing here invents that.
 *
 * How thick the deck itself stands is here for the same reason: it is that one
 * count read the other way round, and the rule binds it the same way.
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
 * How many edges the deck shows under its top card when the box is full. Two,
 * which is what the stack has always drawn — `.card-stack-layer:nth-child` in
 * `index.css` places them, and is the other half of this number.
 */
export const DECK_EDGES = 2;

/**
 * How many of those edges show with this many Cards left: the deck's thickness,
 * which is an impression and not a gauge. The count is printed on the deck and
 * is the truth; this only has to keep a box with four Cards in it from looking
 * like a full one, and nobody should be counting edges to work out the number
 * standing beside them. Hence thirds of the box rather than anything finer —
 * per-Card fidelity would turn a decoration into a second number that disagrees
 * with the first.
 *
 * Counts and nothing else, like everything else here: how many are left, never
 * which (ADR 0003).
 *
 * A deck that thins used to be refused, because drawing the last Card puts all
 * 56 back and the stack would have popped from bare to full for something that
 * was not an event. It is an event now — the played pile is picked up and
 * settles onto the deck — so the deck fills out under it instead of popping,
 * which `--deck-refill` in `index.css` is what times.
 */
export const deckEdges = (left: number): number =>
  Math.min(
    Math.max(Math.ceil((left * (DECK_EDGES + 1)) / DECK_SIZE) - 1, 0),
    DECK_EDGES,
  );

/**
 * The angles Cards come to rest at, walked in order as the pile grows. A few
 * degrees either side of square: the pile should read as dealt, not scattered,
 * and an edge that swung further would reach across the printed line of the
 * Card lying on it.
 *
 * Nine of them, which is enough that no two Cards near each other in the pile
 * land at the same angle and short enough to read as a list of angles rather
 * than a table of data. The pile draws four layers at most — the top of it and
 * three under — so the angle on top comes round again about six layers below
 * the deepest edge on screen, which is far enough that nothing repeats.
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
 * `faceUp` says whether a Card is drawn face-up on top — the Card in force, or
 * the last one played once the Turn has let it go. Either way it is the newest
 * Card on the pile, so it is not also one of the edges beneath itself. It is
 * deliberately not `pickedUp`'s question, which is the narrower one: a Card
 * lying spent on top still covers an edge, but it is not a pile about to be
 * picked up.
 *
 * Drawing the 56th Card puts all 56 back, so a full deck and a Card face-up on
 * it are true at the same moment: the pile has just been picked up and that
 * Card is the only thing on the new one. Hence the floor rather than a
 * subtraction that is allowed to go negative.
 */
export const buriedCards = (left: number, faceUp: boolean): number =>
  Math.min(Math.max(DECK_SIZE - left - (faceUp ? 1 : 0), 0), MAX_BURIED);

/**
 * Whether the pile has just been picked up, turned face-down and made the deck
 * again. Drawing the last Card of the box puts all 56 back, so a full deck with
 * a Card in force is the one position that can only have arrived that way — an
 * untouched deck has nothing face-up beside it, and every other draw leaves the
 * deck short.
 *
 * In force, and not merely lying face-up: those two part company the moment the
 * Turn hands on. The deck stays at 56 until somebody draws again and nothing
 * makes them (ADR 0005), so the Card that emptied the box can lie there spent
 * for days — and asking the wider question would have every device that mounts
 * in that window fly the pick-up again, onto a deck already drawn full.
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
