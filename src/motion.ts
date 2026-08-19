import { DRAW_MS, FLIGHT_MS, FLIP_MS, PICKUP_MS } from "./settled";

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
 * The leaderboard rows exchanging places — and the first layout animation in
 * the app, which is worth saying because an earlier ticket deliberately added
 * none. Nothing on this screen changed place then, and inventing movement for
 * things that stayed put would have been a visible change nobody asked for.
 * Something changes place now, so that reason has expired and only that one
 * has: everything else here is still a transform on a thing that is where it
 * was.
 *
 * It costs a feature set, and the cost is a number: `LazyMotion` in `App.tsx`
 * loads `domMax` rather than `domAnimation` for it — layout animation is not in
 * the smaller bundle — which is 13.35 kB gzipped, 135.99 against 122.64,
 * measured both ways with `npm run build`. That is nearly all of what moving to
 * `LazyMotion` saved, spent on this one movement, and it brings drag with it,
 * which nothing here uses. The figure is at the import as well as here.
 *
 * There is no module here describing the movement, and there should not be: the
 * rows are keyed by Seat, the order they are rendered in changes, and the
 * library measures the before and after and animates between them. Writing our
 * own would be a description of something already being done, and a test of it
 * would assert the description.
 */

/**
 * A row moving to its new place. A spring, because a row arrives — but the
 * smallest `bounce` on this screen, for the reason `DIE_LANDING` has one at
 * all: the rows are stacked against each other with no gap, so a row that
 * overshot would ride over its neighbour on the way. At 0.15 the overshoot is
 * under 1% of the distance, which over a rank row's ~18px is a fraction of a
 * pixel and collides with nothing.
 *
 * Shorter than the count that causes it (`COUNT_MS`, 500ms at its longest). The
 * swap starts part-way through — on the step the numbers cross — so the row is
 * in its place by the time the number it is chasing has stopped, and the two
 * finish as one event rather than the movement outlasting its cause.
 */
export const ROW_SWAP = {
  type: "spring",
  duration: 0.3,
  bounce: 0.15,
} as const;

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

/**
 * The draw, as one gesture: a Card turned over off the deck's edge into the slot
 * beside it. »Aufgeschlagen«, which is what a hand does — a card is not slid across
 * a table and then flipped, it is turned over off the pile into place.
 *
 * It replaces a flight and a flip played one after the other, and it is the same
 * `DRAW_MS` long, so `settled.ts` still says how long the news waits and nothing
 * downstream of it moved.
 *
 * **Sampled, and `linear`.** Every number below was set by looking at the movement
 * held still frame by frame (`src/prototype/`, on the throwaway branch), because a
 * 780ms turn is wrong for about 80ms of itself and watching it play does not find
 * that. Four acts:
 *
 *   0–14%    the beat. The Card lies face-down where the deck is standing,
 *            indistinguishable from the deck's own top card, and nothing moves.
 *            This is the moment before the Player knows what they drew.
 *   14–52%   the lift, off the hinge and toward the Player.
 *   52–80%   over the top and down into the slot.
 *   80–100%  the settle, through a 6° overshoot. Small: a card has no bounce in
 *            it, and this is the paper flexing.
 *
 * **The rotation is negative, and that is the whole difference between this reading
 * right and reading wrong.** `rotateY(t)` sends a point at x=d to z' = -d·sin(t), so
 * turning from +180° down to +90° puts the Card's free edge at z = -d — away from
 * the Player, behind the page, for the whole first half of the turn, coming back out
 * of it afterwards. From -180° the same sweep puts that edge at z = +d and the Card
 * lifts off the pile toward the Player instead. Same start, same end, same duration;
 * only the way round.
 *
 * `z` is the second half of that: 26px out of the page at the top of the turn, which
 * with the slot's perspective magnifies the Card evenly and makes it read as
 * *lifted* rather than merely rotated. The hinge and the vanishing point are both at
 * the slot's left edge — `index.css` on `.card-slot` and `.card-flip`.
 *
 * `x` is the gap between the two piles and nothing else. Mirrored about its own left
 * edge the Card lands one card-width to the left, and the deck is one card-width
 * *and the gap* away; `Card.tsx` measures that rather than writing it down, so the
 * deal is still right if the row's spacing changes.
 */
export const DRAW = DRAW_MS / 1000;

/** Where the four acts meet, as fractions of `DRAW`. */
export const DEAL_TIMES = [0, 0.14, 0.52, 0.8, 0.92, 1];

/** The turn itself, in degrees, at each of those moments. */
export const DEAL_TURN = [-180, -180, -88, -7, 6, 0];

/** And how far out of the page it comes, in pixels, at each of them. */
export const DEAL_LIFT = [0, 0, 26, 4, 0, 0];

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
