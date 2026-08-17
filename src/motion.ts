/**
 * The app's motion, in one place: two things fly on the play screen and one of
 * them then turns over, and every number those movements are made of is here.
 * Two lanes each invented a flight and landed 50ms apart under the same name,
 * which is a difference nobody chose and nobody could see.
 *
 * Reduced motion is not decided here. It stays the library's hook at each call
 * site, so there is one mechanism for turning motion off rather than a number
 * here that could quietly be set to zero instead.
 */

/**
 * Seconds a flight takes — the Card off the pile, a die out of the hand — and
 * so also how long the Card's flip waits before it starts.
 *
 * One duration and not one each: both are the same gesture, a thing replaying a
 * move the server has already made (ADR 0001) by travelling from where it was
 * to where it already is. The distances differ; the gesture does not. If a die
 * ever wants to be quicker than a Card — it is dead time before the next tap,
 * where the Card's flight is a beat the Player is meant to watch — that is a
 * second constant here with its reason attached, and a gap big enough to see.
 */
export const FLIGHT = 0.4;

/** Quick away, soft landing: a thing arriving, not a thing thrown. */
export const FLIGHT_EASE: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

/** Seconds the drawn Card takes to turn face-up, once it has landed. */
export const FLIP = 0.38;

/** Even and unhurried: the Card is turning over, not travelling. */
export const FLIP_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
