import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { m, useReducedMotion } from "motion/react";
import { cardFace, type CardFamily, type CardMark } from "./cards";
import { DieFace } from "./Die";
import { ALL_FACES } from "./dice";
import { flightStart, type FlightStart, type Rect } from "./flight";
import {
  CARD_LANDING,
  FLIGHT,
  FLIGHT_EASE,
  FLIP,
  FLIP_EASE,
  PICKUP,
} from "./motion";
import type { Card } from "./game/turn";
import {
  buriedCards,
  cardsPlayed,
  deckEdges,
  pickedUp,
  tiltOf,
  DECK_EDGES,
  PICKED_UP_DEPTH,
} from "./pile";

/**
 * The Card in front of the Player, and the deck it came out of. The draw is a
 * replay, not a deal: the server already chose the Card (ADR 0001) and the deck
 * is only a count of what is left (ADR 0003), so nothing here knows or asks
 * what the next Card will be.
 */

/**
 * Jade pays you, orchid multiplies you, ember takes the choice away. Three hues
 * far enough apart to be told apart across the room, saturated rather than pale
 * so that the Card is the brightest thing on a table with no colour of its own,
 * and dark ink on all three — which is a printed card, and which is also what
 * keeps the corner index legible at the size a corner index is.
 */
const FAMILY_CLASS: Record<CardFamily, string> = {
  bonus: "bg-jade text-ink",
  multiplier: "bg-orchid text-ink",
  forcing: "bg-ember text-ink",
};

/**
 * One flat mark per family, ours and drawn here: a star for the Cards that pay
 * you, two overlapping diamonds for the one that doubles you, a padlock for the
 * five that take the choice to Stop away. Nothing here is traced from or
 * imitates the published game's artwork.
 *
 * A `switch` rather than a chain of `family === "…" &&`, for the same reason
 * `Mark` is one: `noImplicitReturns` makes a fourth family a compile error
 * here, where the chain would have drawn an empty square instead.
 */
function motifOf(family: CardFamily) {
  switch (family) {
    case "bonus":
      return (
        <path d="M12 2.2 14.9 9h7.1l-5.7 4.6L18.4 21 12 16.8 5.6 21l2.1-7.4L2 9h7.1Z" />
      );
    case "multiplier":
      return (
        <>
          <path d="M7 2.5 12.5 12 7 21.5 1.5 12Z" />
          <path d="M17 2.5 22.5 12 17 21.5 11.5 12Z" opacity="0.6" />
        </>
      );
    case "forcing":
      return (
        <>
          <path
            d="M7.4 10.5V7.4a4.6 4.6 0 0 1 9.2 0v3.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <rect x="4" y="10.2" width="16" height="11.3" rx="2.2" />
        </>
      );
  }
}

function FamilyMotif({ family }: { family: CardFamily }) {
  return (
    <svg
      aria-hidden
      className="card-motif"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      {motifOf(family)}
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
 * Every kind of mark has an arm here, and a kind added to `CardMark` without
 * one is a compile error rather than a Card with an empty middle. That is
 * `noImplicitReturns` doing it, not a `never` guard: the guard would be
 * unreachable code carrying the promise, while the flag makes the `switch`
 * itself the promise.
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
 * The deck: face-down, and as thick as the count says it is. It stands in the
 * stat row next to the slot the Card lands in, one card wide, so the two read
 * as the two piles on a table. The `ref` is on the stack itself, because it is
 * what a draw flies out of and the flight is measured from where it really is.
 *
 * Its box is one card at every depth and its top card never moves: thinning
 * pulls the edges in under the top one, which is a transform and takes no
 * space. So nothing on the screen shifts as the Game runs the box down.
 */
export function CardStack({
  left,
  ref,
}: {
  left: number;
  ref: RefObject<HTMLDivElement | null>;
}) {
  // The one mechanism for reduced motion in the app, the same hook the dice and
  // the Cards ask. Without it the edges slide out as the pile lands on them;
  // with it the deck is simply the thickness the count says, from one frame to
  // the next.
  const still = useReducedMotion();
  const edges = deckEdges(left);

  return (
    <div
      className={`card-stack${still ? "" : " card-stack-settling"}`}
      ref={ref}
    >
      {/* The edges of what is still in the box. An edge that is not showing is
          not removed — it lies exactly under the top card, where it is hidden
          — so a deck filling out is edges sliding out from under a card that
          has not moved, rather than layers appearing.

          The last edge to go is the one on the far side from the played pile:
          a thinning deck stops fanning towards its neighbour before it stops
          fanning at all, and the two piles never merge into one. */}
      {Array.from({ length: DECK_EDGES }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className="card-stack-layer card-frame card-back"
          style={{ "--shown": index < edges ? 1 : 0 } as CSSProperties}
        />
      ))}
      <div className="card-stack-layer card-frame card-back card-stack-top">
        <span aria-hidden className="card-wordmark">
          TUTTO
        </span>
        {/* Counting what is left in the deck is part of playing well. */}
        <span className="sr-only">Karten</span>
        <span className="text-xl font-bold">{left}</span>
      </div>
    </div>
  );
}

/**
 * The pile with nothing on it — dashed, and holding its full height beside the
 * deck. It wears the same `.card-slot` as a drawn Card, so the corner and the
 * space are a card's, stated in one place rather than restated here.
 */
function EmptyCardSlot() {
  return <div className="card-slot placeholder" />;
}

/**
 * What the Card does, spelled out: the one place a rule is given in full, so it
 * keeps the whole width under the stat row even though the Card itself has
 * moved up into it.
 *
 * Its own element and not part of `DrawnCard`, so it outlives a draw: it is on
 * screen with an empty slot, holding the same room, and a Card arriving lands
 * in a space that was already there. How much room, and why that much, belongs
 * to `.card-effect`, which is what reserves it.
 *
 * Outliving the draw is also why the Card it is given is the *settled* one and
 * not the Card flying above it. This sentence names the Card in plain German;
 * given the live one it would do so while the Card is still face-down, and the
 * flip would have nothing left to reveal. `Game.tsx` is where the two are told
 * apart, because that is where the settled position is.
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
 * How a Card lies on the pile: how deep under the top it is, and the angle it
 * came to rest at. Both are read off the position and nothing else — `tiltOf`
 * in `pile.ts` carries the argument for deriving the angle rather than dealing
 * it afresh.
 *
 * `.played-lie` in `index.css` is what turns the two into a transform, and is
 * the other half of this.
 */
const lying = (
  /** How many Cards are on the pile — the top one landed at this number. */
  played: number,
  /** How many Cards lie on top of this one. The top of the pile is `0`. */
  depth: number,
): CSSProperties => {
  const style: CSSProperties & Record<string, string> = {
    "--depth": `${depth}`,
    // Named apart from the die's `--die-tilt`: custom properties inherit, so
    // two unrelated angles under one name would meet the moment anything is
    // drawn inside anything else.
    "--card-tilt": `${tiltOf(played - depth)}deg`,
  };
  return style;
};

/**
 * The printed face of a Card: what it does, what it is called, and the index in
 * both corners the way a playing card carries it.
 *
 * One face, drawn once, for the Card in force and for the Card lying under it —
 * the pile shows two of them and they are the same printed thing, one flying in
 * and one already settled.
 */
function CardSide({ card }: { card: Card }) {
  const { family, name, mark, corner } = cardFace(card);
  return (
    <div className={`card-side card-frame ${FAMILY_CLASS[family]}`}>
      {/* The index in both corners, as a playing card carries it. The name
          below says the same thing, so this is decoration to a screen
          reader. */}
      <span aria-hidden className="card-corner card-corner-start">
        {corner}
      </span>
      {/* What the Card does, and under it what to call it. The name is small
          because the mark is the point — but it is real text, and on the Cards
          whose mark is drawn it is the only text on the face a screen reader
          has to go on. It sits below the mark, not above: the corner index is
          the opening of the same word, and »FEUE« directly over »Feuerwerk«
          reads as a typo. */}
      <Mark mark={mark} />
      {name !== null && <span className="card-name">{name}</span>}
      <FamilyMotif family={family} />
      <span aria-hidden className="card-corner card-corner-end">
        {corner}
      </span>
    </div>
  );
}

/**
 * The Card played before the one in force, lying face-up under it. It does not
 * fly and it does not flip: its arrival was news one draw ago, and it is drawn
 * here only because a table does not clear the last Card played until another
 * lands on it.
 *
 * Which is also why it is not read out again. The Card in force is the one the
 * screen speaks about — it is the Card the sentence under the pile explains —
 * and this one is the picture of a Card that has already been announced.
 */
function SettledCard({ card, played }: { card: Card; played: number }) {
  return (
    <div
      aria-hidden
      className="card-slot played-lie played-settled"
      style={lying(played, 1)}
    >
      <CardSide card={card} />
    </div>
  );
}

/**
 * A Card that has just been drawn, lying on top of the played pile. Mounting is
 * what plays the draw — it flies out of the stack face-down and flips face-up
 * on arrival — so a reload replays it, exactly as a reload replays the dice
 * tumble.
 *
 * It lands on the pile rather than into a slot, but nothing about the flight
 * changed with it: the two rectangles are measured where they are, and the
 * pile's box is the same one card the slot was.
 */
function DrawnCard({
  card,
  played,
  pile,
}: {
  card: Card;
  /** How many Cards are on the pile: this one landed on top, at that angle. */
  played: number;
  /** The pile this Card came off, so the flight can start where it really is. */
  pile: RefObject<HTMLDivElement | null>;
}) {
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
    // At its own angle, the one the pile says a Card landing here lands at. It
    // is on the slot rather than on the flight inside it, so the Card is
    // already lying the way it will lie while it is still in the air — a Card
    // that straightened out as it touched down would be a second beat nobody
    // asked for, on top of the flip.
    <div className="card-slot played-lie" style={lying(played, 0)} ref={slot}>
      {/* Two beats, not one compound move: the flight off the pile, then the
          flip. Both are `transform` only, so they stay on the compositor.
          Nothing about where the pile sits is written down here — it is two
          rectangles measured at draw time, which is why the flight is still
          right when the »letzte Runde« banner has pushed the slot down. */}
      {(still || start !== null) && (
        <m.div
          className="card-flight"
          // The offset and no scale, which costs this end nothing: the pile and
          // the slot are both `var(--card-width)`, so there is no size to
          // travel through in the first place. Were the pile ever drawn smaller
          // than the slot, a scale here would be a real choice with a real
          // objection — a Card growing mid-flight sweeps outside its slot and
          // over the »Im Zug« tile beside it.
          //
          // `false` is reduced motion, and also the layout that measured as
          // nothing: either way there is no flight and no flip.
          initial={start ?? false}
          animate={{ x: 0, y: 0 }}
          // A spring, and so a Card that goes a little past its place and
          // settles back into it. It runs for the same `FLIGHT` the eased
          // version did — `motion.ts` says why a spring here is given a
          // duration rather than a stiffness — so the flip below still starts
          // on the frame it landed and `settled.ts` still waits exactly as
          // long as it did.
          transition={CARD_LANDING}
        >
          <m.div
            className="card-flip"
            initial={start === null ? false : { rotateY: 180 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: FLIP, delay: FLIGHT, ease: FLIP_EASE }}
          >
            {/* The face is readable from the first frame of the flight, on
                purpose. Hiding it for the 780ms the Card is in the air would
                protect a beat a screen reader user cannot perceive, at the cost
                of information they can — and it would be the smaller secret:
                `Die.tsx` gives every die's face to AT the moment the tumble
                starts, deliberately, and six faces say more than one Card's
                name. Spoiling the larger thing while hiding the smaller is not
                a position worth holding, so this stays. */}
            <CardSide card={card} />
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

/**
 * The Cards under the top of the pile, drawn as edges and nothing else — the
 * position holds no face for them and no order to lay them in (ADR 0003).
 *
 * Decoration to a screen reader: a Card's edge has nothing that could be read
 * out, and the one Card that can be read is face-up on top.
 */
function PileEdges({
  played,
  from,
  count,
}: {
  /** How many Cards are on the pile, which is what sets each one's angle. */
  played: number;
  /** How deep the shallowest of these edges lies: `1` under a bare Card. */
  from: number;
  count: number;
}) {
  return (
    <div aria-hidden className="played-edges">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="played-layer played-lie card-frame"
          style={lying(played, from + index)}
        />
      ))}
    </div>
  );
}

/**
 * The pile going back in the box: it lifts, turns face-down and settles on the
 * deck, which is what it now is. This is the moment the app used to paper over
 * — the count jumping from 1 to 56 — and the jump is now the thing you watched
 * happen.
 *
 * It carries no face and could not: a Card is only ever drawn when none is in
 * force, so at the instant the pile is picked up there is nothing face-up on it.
 * Which Cards go back, and in what order, is not drawn, not implied and not in
 * the position to draw (ADR 0003).
 *
 * The flight is the draw's, run the other way round — two rectangles measured
 * where they really are, so it is still right when the »letzte Runde« banner
 * has moved the row. It paints outside its box and takes no space, so the pile
 * keeps its one card of height throughout and nothing below it moves.
 */
function PickUp({
  deck,
  onLanded,
}: {
  /** Where it is going: the draw pile it is about to be. */
  deck: RefObject<HTMLDivElement | null>;
  /** It has landed, so the Card the Player asked for can come off the deck. */
  onLanded: () => void;
}) {
  const here = useRef<HTMLDivElement>(null);
  // Measured after layout and before paint, exactly as the draw's is, so the
  // first frame the pile is painted in is the frame it lifts off from.
  const [landing, setLanding] = useState<FlightStart | null>(null);
  useLayoutEffect(() => {
    setLanding(flightStart(rectOf(deck.current), rectOf(here.current)));
  }, [deck]);

  return (
    <div className="card-pickup" ref={here}>
      {landing !== null && (
        <m.div
          className="card-pickup-flight"
          initial={{ x: 0, y: 0, rotateY: 0, scale: 1 }}
          // Up, across, and face-down on the deck. The scale is the lift: a
          // pile picked up off a table comes towards you before it goes
          // anywhere, and without it this is a slide rather than a pick-up.
          animate={{ ...landing, rotateY: 180, scale: [1, 1.08, 1] }}
          transition={{ duration: PICKUP, ease: FLIGHT_EASE }}
          onAnimationComplete={onLanded}
        >
          {/* Edges and nothing else, however many Cards are really going back:
              the pile is picked up when the last Card comes off the deck, and
              with one Card left the box has 55 of them lying here. */}
          <PileEdges played={cardsPlayed(1)} from={0} count={PICKED_UP_DEPTH} />
        </m.div>
      )}
    </div>
  );
}

/**
 * A Card arriving on the pile — and, when the deck had to be remade to fetch
 * it, the pick-up that happens first. Two beats end to end: the pile goes back
 * on the deck, and only then does the Card come off it, because a Card cannot
 * come off a deck that is not there yet. `animationMs` adds the two the same
 * way, so the screen's news waits for both and not just the second.
 *
 * Mounted fresh per draw, which is what plays the pick-up once and what stops a
 * pile that has already been picked up from being picked up again on the next
 * render.
 */
function Landing({
  card,
  played,
  picked,
  pile,
}: {
  card: Card;
  /** How many Cards are on the pile: this one is landing on top of them. */
  played: number;
  /** This draw emptied the deck, so the pile lying here is the deck now. */
  picked: boolean;
  pile: RefObject<HTMLDivElement | null>;
}) {
  // The one mechanism for reduced motion in the app, the same hook the dice and
  // the drawn Card ask. Nothing lifts, nothing turns over, nothing settles: the
  // counts simply change and the Card is simply there.
  const still = useReducedMotion();
  const [landed, setLanded] = useState(false);

  if (!picked || still || landed) {
    return <DrawnCard card={card} played={played} pile={pile} />;
  }
  return (
    <>
      {/* What the pile is while its Cards are in the air: an empty place, the
          same one it wears before the Game's first Card. It is drawn first so
          the pile lifting off passes over it rather than under it. */}
      <EmptyCardSlot />
      <PickUp deck={pile} onLanded={() => setLanded(true)} />
    </>
  );
}

/**
 * The played pile: every Card drawn so far. The newest is face-up on top, the
 * Card played before it face-up beneath at its own angle so both edges show,
 * and everything older is the blank edge it has to be. It belongs to the Game
 * and not to the Turn — Cards from every Seat land here and a new Turn does not
 * clear it — which is what makes the top of the screen a table rather than one
 * Player's hand.
 *
 * Two faces and no more, and that is not a stylistic choice. The Game keeps the
 * deck as counts, the Card the Turn holds and the one played before it, and
 * nothing else (ADR 0007) — so what is buried under those two, and in what
 * order, is simply not in the position. The pile says how deep it is, which is
 * the deck's own count read the other way round and the number already printed
 * on the pile next to it, and says nothing else. The per-Card counts are never
 * touched here, which is the direction that rule binds in.
 *
 * The box is one Card and stays one Card at any depth: everything under the top
 * is offset by transform, which paints outside the box and takes no space. So
 * the stat row is the same height at one Card as at forty, and nothing below it
 * moves as the Game runs.
 */
export function PlayedPile({
  top,
  beneath,
  inForce,
  left,
  pile,
}: {
  /**
   * The Card face-up on top: the one in force, or — at the start of a Turn and
   * just after a TUTTO — the last Card played, which lies there until somebody
   * plays another. `null` only for a pile with nothing on it.
   */
  top: Card | null;
  /** The Card face-up under it, or `null` when the position does not hold it. */
  beneath: Card | null;
  /**
   * Whether a Card is in force, which is a narrower thing than one lying face
   * up on top and the difference is the pick-up. A full deck says the pile was
   * just picked up only while the Turn that emptied it is still holding the
   * Card it drew: after that the deck stands at 56 with the Card lying spent on
   * top, and nothing forces the next Player to draw (ADR 0005), so that window
   * can last days. A phone mounting into it would fly the pick-up again, onto a
   * deck already drawn full.
   */
  inForce: boolean;
  /** Cards still in the deck — how deep this pile is, read the other way. */
  left: number;
  /** The deck, so a Card landing here can measure where it flew from. */
  pile: RefObject<HTMLDivElement | null>;
}) {
  const played = cardsPlayed(left);
  const buried = buriedCards(left, top !== null);
  // Only a Card that is really under the top one. The pile going back into the
  // box is the case that needs saying: the deck is full again, the Card that
  // emptied it is the only thing on the new pile, and the Card played before it
  // is in the deck now rather than under it.
  const under = buried > 0 ? beneath : null;

  return (
    <div className="played-pile">
      {/* What the position cannot name, drawn as the edges it is. They start
          under whatever is face-up, so a Card lands on the pile without
          disturbing anything beneath it. */}
      <PileEdges
        played={played}
        from={under === null ? 1 : 2}
        count={buried - (under === null ? 0 : 1)}
      />
      {under !== null && <SettledCard card={under} played={played} />}
      {/* The key is what mounts a fresh element, and so what plays the draw —
          every draw moves the count, so every draw is a fresh element. That
          includes the draw that empties the deck, which is the one that has the
          pile picked up in front of it.

          A Card that is spent but still lying there keeps the same key: a TUTTO
          and the end of a Turn take the Card out of force without moving it, so
          nothing remounts and nothing flies. The draw is the only thing that
          ever moves a Card here, and it moves two at once — the new one out of
          the deck and the old one down a layer, which happens on the same
          render and so needs no beat of its own. Its leaving is not news; you
          already knew what it was. */}
      {top !== null ? (
        <Landing
          key={`${top}-${left}`}
          card={top}
          played={played}
          picked={pickedUp(left, inForce)}
          pile={pile}
        />
      ) : (
        <EmptyCardSlot />
      )}
    </div>
  );
}
