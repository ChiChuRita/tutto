import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { m, useReducedMotion } from "motion/react";
import { cardFace, type CardFamily, type CardMark } from "./cards";
import { DieFace } from "./Die";
import { ALL_FACES } from "./dice";
import { flightStart, type FlightStart, type Rect } from "./draw";
import type { Card } from "./game/turn";

/**
 * The Card in front of the Player, and the deck it came out of. The draw is a
 * replay, not a deal: the server already chose the Card (ADR 0001) and the deck
 * is only a count of what is left (ADR 0003), so nothing here knows or asks
 * what the next Card will be.
 */

/** Seconds the flight takes, and so how long the flip waits before it starts. */
const FLIGHT = 0.4;

/** Green pays you, blue multiplies you, red takes the choice away. */
const FAMILY_CLASS: Record<CardFamily, string> = {
  bonus: "bg-green-700 text-white",
  multiplier: "bg-blue-700 text-white",
  forcing: "bg-red-700 text-white",
};

/**
 * One flat mark per family, ours and drawn here: a star for the Cards that pay
 * you, two overlapping diamonds for the one that doubles you, a padlock for the
 * five that take the choice to Stop away. Nothing here is traced from or
 * imitates the published game's artwork.
 */
function FamilyMotif({ family }: { family: CardFamily }) {
  return (
    <svg
      aria-hidden
      className="card-motif"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      {family === "bonus" && (
        <path d="M12 2.2 14.9 9h7.1l-5.7 4.6L18.4 21 12 16.8 5.6 21l2.1-7.4L2 9h7.1Z" />
      )}
      {family === "multiplier" && (
        <>
          <path d="M7 2.5 12.5 12 7 21.5 1.5 12Z" />
          <path d="M17 2.5 22.5 12 17 21.5 11.5 12Z" opacity="0.6" />
        </>
      )}
      {family === "forcing" && (
        <>
          <path
            d="M7.4 10.5V7.4a4.6 4.6 0 0 1 9.2 0v3.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <rect x="4" y="10.2" width="16" height="11.3" rx="2.2" />
        </>
      )}
    </svg>
  );
}

/**
 * A drawn mark, on the square the family motif and the die faces share. Flat,
 * one colour, and ours: nothing here is traced from or imitates the published
 * game's artwork.
 */
function CardSymbol({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden className="card-symbol" viewBox="0 0 24 24">
      {children}
    </svg>
  );
}

/** A drawn line: the stop sign's outline and bar, and the burst's rays. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * The middle of the Card: what the Card *does*. A numeral where the number is
 * itself the meaning — a Bonus, ×2 — and otherwise a drawing, sized directly.
 * There is no formula fitting the mark across the card, because there is no
 * longer a nine-letter German word to fit.
 *
 * The drawn marks are decoration to a screen reader: the Card's name is in
 * small type under them, and the whole rule reads below the card in
 * `CardEffect`.
 */
function Mark({ mark }: { mark: CardMark }) {
  switch (mark.kind) {
    case "number":
      return <span className="card-mark">{mark.text}</span>;
    case "plusMinus":
      // The thousand it gives over the thousand it takes — the whole Card.
      return (
        <span className="card-mark card-mark-pair">
          <span>+1000</span>
          <span>−1000</span>
        </span>
      );
    case "stopSign":
      // The road sign's shape: a regular octagon, barred.
      return (
        <CardSymbol>
          <g {...STROKE} strokeWidth={2.2}>
            <path d="M7.8 1.9h8.4l5.9 5.9v8.4l-5.9 5.9H7.8l-5.9-5.9V7.8Z" />
            <path d="M7.2 11.9h9.6" />
          </g>
        </CardSymbol>
      );
    case "burst":
      // Rays off a bright centre: a firework at the moment it opens.
      return (
        <CardSymbol>
          <g {...STROKE}>
            <path d="M12 2.4v4.6M12 17v4.6M2.4 12H7M17 12h4.6M5.2 5.2l3.3 3.3M15.5 15.5l3.3 3.3M18.8 5.2l-3.3 3.3M8.5 15.5l-3.3 3.3" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
          </g>
        </CardSymbol>
      );
    case "run":
      // The run itself: 1 through 6, drawn by the same thing that draws the
      // dice in the hand, so a die on a Card is the die the Player is holding.
      return (
        <span aria-hidden className="card-run">
          {ALL_FACES.map((face) => (
            <DieFace key={face} face={face} className="card-run-die" />
          ))}
        </span>
      );
    case "clover":
      // Four leaves and a stem. Four, because the Card is the Kleeblatt.
      return (
        <CardSymbol>
          {/* Four leaves on the diagonals, overlapping just enough to join:
              the notches left on the axes are what makes it a clover and not a
              flower. */}
          <g fill="currentColor">
            <circle cx="15.8" cy="6.6" r="4.5" />
            <circle cx="15.8" cy="14.2" r="4.5" />
            <circle cx="8.2" cy="14.2" r="4.5" />
            <circle cx="8.2" cy="6.6" r="4.5" />
          </g>
          <path
            {...STROKE}
            strokeWidth={1.6}
            d="M12 15.8c.4 3-.1 4.9-1.6 6.3"
          />
        </CardSymbol>
      );
  }
}

/**
 * The deck: face-down, three layers deep whatever the count says. The `ref` is
 * on the stack itself rather than its share of the row, because it is what a
 * draw flies out of and the flight is measured from where it really is.
 */
export function CardStack({
  left,
  ref,
}: {
  left: number;
  ref: RefObject<HTMLDivElement | null>;
}) {
  return (
    // The wrapper takes the stack's share of the stat row; the stack itself is
    // one card wide in the middle of it, the same object as the Card below.
    <div className="flex-1">
      <div className="card-stack" ref={ref}>
        {/* Always three layers. The count carries the truth, so the stack does
            not twitch when the last Card drawn puts all 56 back in. */}
        <span aria-hidden className="card-stack-layer card-frame card-back" />
        <span aria-hidden className="card-stack-layer card-frame card-back" />
        <div className="card-stack-layer card-frame card-back card-stack-top">
          <span aria-hidden className="card-wordmark">
            TUTTO
          </span>
          {/* Counting what is left in the deck is part of playing well. */}
          <span className="sr-only">Karten</span>
          <span className="text-xl font-bold">{left}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * The slot with no Card in it — dashed, and holding its full height. It wears
 * the same `.card-slot` as a drawn Card, so the corner and the space are a
 * card's, stated in one place rather than restated here.
 */
export function EmptyCardSlot() {
  return <div className="card-slot placeholder" />;
}

/**
 * What the Card does, below it and outside it, small and grey — and always on
 * screen, empty slot or not. It is rendered here rather than inside `DrawnCard`
 * so its height is stated once: two lines' worth, held whether or not there is
 * a Card. The longer effects wrap at 390px, so a draw that added this line
 * would shove the dice, the set-aside row and both button slots down.
 */
export function CardEffect({ card }: { card: Card | null }) {
  return (
    <p className="card-effect">{card === null ? "" : cardFace(card).effect}</p>
  );
}

/** What a rectangle on screen measures, or `null` for one that is not there. */
const rectOf = (element: Element | null): Rect =>
  element === null ? null : element.getBoundingClientRect();

/**
 * A Card that has just been drawn. Mounting is what plays the draw — it flies
 * out of the stack face-down and flips face-up on arrival — so a reload replays
 * it, exactly as a reload replays the dice tumble.
 */
export function DrawnCard({
  card,
  pile,
}: {
  card: Card;
  /** The pile this Card came off, so the flight can start where it really is. */
  pile: RefObject<HTMLDivElement | null>;
}) {
  const { family, name, mark, corner } = cardFace(card);
  // The one mechanism for reduced motion in the app: the library's hook. With
  // no start to animate out of, the Card is simply there, face-up.
  const still = useReducedMotion();
  const slot = useRef<HTMLDivElement>(null);
  // Where the flight begins, once both rectangles are known. The slot cannot be
  // measured until it is in the layout, so the first render puts the empty slot
  // there and no Card. That render never reaches the screen: the measurement
  // and the state it sets happen after layout and before paint, so the Card's
  // first painted frame is already on the pile.
  const [start, setStart] = useState<FlightStart | null>(null);
  useLayoutEffect(() => {
    if (still) return;
    setStart(flightStart(rectOf(pile.current), rectOf(slot.current)));
  }, [pile, still]);

  return (
    <div className="card-slot" ref={slot}>
      {/* Two beats, not one compound move: the flight off the pile, then the
          flip. Both are `transform` only, so they stay on the compositor.
          Nothing about where the pile sits is written down here — it is two
          rectangles measured at draw time, which is why the flight is still
          right when the »letzte Runde« banner has pushed the slot down. */}
      {(still || start !== null) && (
        <m.div
          className="card-flight"
          // `false` is reduced motion, and also the layout that measured as
          // nothing: either way there is no flight and no flip.
          initial={start ?? false}
          animate={{ x: 0, y: 0 }}
          transition={{ duration: FLIGHT, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <m.div
            className="card-flip"
            initial={start === null ? false : { rotateY: 180 }}
            animate={{ rotateY: 0 }}
            transition={{
              duration: 0.38,
              delay: FLIGHT,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <div className={`card-side card-frame ${FAMILY_CLASS[family]}`}>
              {/* The index in both corners, as a playing card carries it. The
                  name below says the same thing, so this is decoration to a
                  screen reader. */}
              <span aria-hidden className="card-corner card-corner-start">
                {corner}
              </span>
              {/* What the Card does, and under it what to call it. The name is
                  small because the mark is the point — but it is real text, and
                  on the Cards whose mark is drawn it is the only text on the
                  face a screen reader has to go on. It sits below the mark, not
                  above: the corner index is the opening of the same word, and
                  »FEUE« directly over »Feuerwerk« reads as a typo. */}
              <Mark mark={mark} />
              {name !== null && <span className="card-name">{name}</span>}
              <FamilyMotif family={family} />
              <span aria-hidden className="card-corner card-corner-end">
                {corner}
              </span>
            </div>
            <div
              aria-hidden
              className="card-side card-side-back card-frame card-back"
            >
              <span className="card-wordmark">TUTTO</span>
            </div>
          </m.div>
        </m.div>
      )}
    </div>
  );
}
