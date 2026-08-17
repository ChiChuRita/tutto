import { FLIGHT_MS, FLIP_MS, PICKUP_MS } from "./settled";

/**
 * The app's motion, in one place: two things fly on the play screen and one of
 * them then turns over, and every movement they are made of is named here. Two
 * lanes each invented a flight and landed 50ms apart under the same name, which
 * is a difference nobody chose and nobody could see.
 *
 * How long each one runs is not restated here. The screen holds a Roll's news
 * back until the movement showing it has finished, so `settled.ts` has to know
 * these durations exactly and keeps them in whole milliseconds; this divides
 * them into the library's seconds and adds the easing, which is the half
 * `settled.ts` has no use for. One number per movement, and news that waits
 * neither longer nor shorter than the thing it is waiting for.
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
 * second constant, stated in `settled.ts` beside this one with its reason
 * attached and a gap big enough to see, and divided here.
 */
export const FLIGHT = FLIGHT_MS / 1000;

/** Quick away, soft landing: a thing arriving, not a thing thrown. */
export const FLIGHT_EASE: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

/*
 * The bounce, and where it is allowed.
 *
 * A thing that *arrives* springs: it goes a little past where it is going and
 * comes back, the way an object with weight does. That is the Card landing on
 * the pile, a die reaching »Herausgelegt«, and a score finishing its count.
 *
 * A die settling out of its tumble does not, ever. A cube that overshoots as it
 * comes to rest reads as a re-roll — the face you were reading turns and turns
 * back — and the tumble is a `preserve-3d` keyframe living on the compositor,
 * which is a second good reason to leave it exactly where it is.
 *
 * `duration` and `bounce` rather than `stiffness` and `damping`, because the
 * duration is not this file's to choose: `settled.ts` holds a Roll's news back
 * for exactly as long as the movement showing it runs, and a spring described by
 * its physics runs for however long it runs. Given a duration, the library
 * solves for a spring that has settled by then, so the news still lands on the
 * frame it always did and only the shape of the movement changed.
 *
 * `bounce` is the one number that differs between them, and it is a measurement
 * rather than a taste. The overshoot of a spring is fixed by its damping ratio,
 * which is `1 - bounce`, and it is a share of the distance travelled — so how
 * far past the target a thing goes depends on how far it came. That matters in
 * exactly one place: a die's berth in »Herausgelegt« is pinned to the die, with
 * only the row's gap between one and the next, and a die that overshot into its
 * neighbour would bring back the paint-order bug that looked like clipping.
 * Hence two numbers and not one.
 */

/**
 * The Card landing: 9% of the way it came, which on a hop between neighbours in
 * the stat row is a few px past the slot and back. It has room to spend — it is
 * the top card of the pile and paints over everything around it — and it is the
 * one arrival on this screen the Player is meant to watch.
 */
export const CARD_LANDING = {
  type: "spring",
  duration: FLIGHT,
  bounce: 0.4,
} as const;

/**
 * A die landing in »Herausgelegt«: 1.5% of the way it came, which off the far
 * side of the grid is 5.3px at the most, measured — a settle you can see and
 * cannot collide with. The row's gap is `--play-set-aside-gap`, 8px on the
 * shortest phone and 17px on the tallest, so nothing overshoots into anything.
 * On the shortest phone that leaves 2.7px of margin, and a longer flight across
 * the grid or a bigger `bounce` here spends it. That gap answers to something
 * larger than this as well — two dice of one column of the grid have to pass
 * each other on the way down, which `index.css` does the arithmetic for — so
 * raising the bounce is the one of the two that has to be argued here.
 */
export const DIE_LANDING = {
  type: "spring",
  duration: FLIGHT,
  bounce: 0.2,
} as const;

/**
 * A score reaching the number it was counting to. The count itself is a plain
 * ramp through the values — `count.ts` owns that and its length is the size of
 * what happened — and this is only the full stop on the end of it: the number
 * swells and settles. It moves nothing, being a `scale`, and it is over well
 * inside the beat before the next tap.
 */
export const COUNT_POP = {
  type: "spring",
  duration: 0.35,
  bounce: 0.5,
} as const;

/** How far a settled score swells before it comes back to size. */
export const COUNT_POP_SCALE = 1.1;

/*
 * One arrival is not stated here, and it is the only one: the scores dialog. It
 * is a native `<dialog>` that opens itself — which is what buys Escape, the
 * backdrop, the top layer and the inert page behind it for nothing — so there is
 * no mount for the library to hook and no state here to hook it from.
 * `@starting-style` in `index.css` animates it instead, off `--ease-arrive`,
 * which is this same overshoot written in the one form CSS has for it. Look
 * there for that one and here for everything else.
 */

/**
 * Seconds the played pile takes to be picked up, turned face-down and set down
 * as the deck. It wears `FLIGHT_EASE`, because quick away and a soft landing is
 * exactly the gesture — it is the same movement in less time, and `settled.ts`
 * carries why it is given less.
 */
export const PICKUP = PICKUP_MS / 1000;

/** Seconds the drawn Card takes to turn face-up, once it has landed. */
export const FLIP = FLIP_MS / 1000;

/** Even and unhurried: the Card is turning over, not travelling. */
export const FLIP_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

/*
 * A Niete: the »Herausgelegt« row swept away and the table under it jolted.
 *
 * These two are stated here outright, in seconds, where the flight and the flip
 * are divided down from `settled.ts`. The difference is what waits for them.
 * The flight and the flip are movements the screen's news waits for, so
 * `animationMs` has to know them exactly. These are the news — they start on
 * the frame the dice have settled and the line says »Niete!«, which is the
 * frame `animationMs` has already delivered — and nothing waits for them. Put
 * in `animationMs`, they would hold the next tap back by exactly the length of
 * the flourish that fills it. `COUNT_MS` is stated in `count.ts` for that same
 * reason, and the score draining away is the third thing playing here.
 */

/** Seconds the forfeited dice take to leave the table. */
export const SWEEP = 0.3;

/**
 * How far each swept die goes, in px. One offset for all of them and no scale:
 * the dice move as one, so no die ever crosses another — which is what would
 * bring back the paint-order bug that looked like clipping, each die being its
 * own flattened stacking context. They go right, into the room the row keeps
 * clear, so nothing is passed over on the way out either.
 */
export const SWEEP_X = 56;

/** Pushed, not thrown: it leaves slowly and is gone by the end. */
export const SWEEP_EASE: [number, number, number, number] = [0.4, 0, 1, 1];

/** Seconds the play screen takes the blow for. Once, and short. */
export const JOLT = 0.2;

/**
 * The blow, in px of `translateY`. Up first and barely back down, because down
 * is where the screen has no room: the table sits above the fold with the
 * buttons at the bottom of it, and a jolt that pushed the page past its own
 * height would hand the Player a scrollbar for a fifth of a second. It is a
 * transform, so it costs no layout and nothing on the screen changes place.
 */
export const JOLT_Y = [0, -6, 4, 0];
