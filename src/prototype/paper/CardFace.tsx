/**
 * PROTOTYPE — throwaway. The Card, drawn for Papier.
 *
 * The original faces are the starting point and most of what they got right
 * stays: a portrait card, the index in two corners the way a playing card
 * carries it, one large mark in the middle saying what the Card *does*, the name
 * in small type under it, a drawn inner frame. `Card.tsx` and `cards.ts` carry
 * why each of those is there and none of it stopped being true.
 *
 * What is redrawn is everything about how it is printed, because Papier is a
 * ground the old faces cannot sit on. They are four saturated grounds and this
 * page is paper with one ink on it, so the question every variant here answers
 * differently is: **where does the rulebook's colour go?**
 *
 * It has to go somewhere. The 2024 box colour-codes its Cards and that is how a
 * Player who owns it knows what has landed (`cards.ts` on `CardColour`), so
 * throwing the colour away to keep the ground clean would be paying for the look
 * with the reading. The three treatments are three answers:
 *
 *   CA  Gestochen — paper card, colour only in the ink of the mark and one rule.
 *   CB  Banderole — paper card with a coloured band across the head.
 *   CC  Farbfeld  — the whole ground tinted, the closest to the original.
 *
 * The marks themselves are redrawn once, shared by all three: heavier line, a
 * proper octagon, a firework with rays of two lengths, the run set as six real
 * die faces on a rule. That part is not a variant — it is just better drawing.
 */
import type { CSSProperties, ReactNode } from "react";
import { cardFace } from "../../cards";
import type { Card } from "../../game/turn";
import type { CardColour, CardMark } from "../../cards";
import { ALL_FACES } from "../../dice";
import { Pips } from "../Pips";
import type { CardStyle } from "./cardStyles";

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const RULE = "#d9d3c6";
const QUIET = "#7c7669";

/**
 * The rulebook's four, and now the rulebook's own values.
 *
 * The first pass here muted them to sit politely on paper, and that was the wrong
 * trade: the colour is the one thing on a Card that is not ours to redesign — it
 * is how a Player who owns the 2024 box knows what has landed (`cards.ts` on
 * `CardColour`). So `ink` is the app's existing token, unchanged, and only the
 * ground is invented:
 *
 *   cobalt  #14479b   Bonus 200–600, ×2, Straße
 *   ember   #b8291f   Stop-Karte, Plus/Minus
 *   fern    #1f7a3d   Feuerwerk
 *   straw   #f0d9a0   Kleeblatt — which in the deck is a *ground*, not an ink
 *
 * Straw is the odd one and it is odd in the real deck too: it is the one pale
 * Card, so its published colour is the wash and the ink beside it is a deep straw
 * of the same hue rather than the token. That is the same split `index.css`
 * already makes when it says cream is the one ground that cannot carry chalk.
 *
 * The washes are each colour lifted toward the paper far enough to carry its own
 * ink as type and to stay unmistakably that hue — a blue card has to look blue
 * across the table, not grey.
 */
const PRESS: Record<CardColour, { ink: string; wash: string }> = {
  cobalt: { ink: "#14479b", wash: "#dce5f4" },
  ember: { ink: "#b8291f", wash: "#f7ddd8" },
  fern: { ink: "#1f7a3d", wash: "#dbebdf" },
  straw: { ink: "#8a6420", wash: "#f2ddac" },
};

/* ------------------------------------------------------------------ marks -- */

const stroke = (width: number): CSSProperties => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: width,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

function Symbol({ children, em = 2 }: { children: ReactNode; em?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      style={{ width: `${em}em`, height: `${em}em`, display: "block" }}
    >
      {children}
    </svg>
  );
}

/**
 * The middle of the Card. Same six kinds as the original — a numeral where the
 * number is the meaning, a drawing otherwise — and a `switch`, so a seventh kind
 * is a compile error rather than an empty middle.
 */
export function CardMarkArt({ mark }: { mark: CardMark }) {
  switch (mark.kind) {
    case "number":
      // Set in the text face rather than a display sans: on a printed card the
      // numeral is type, and Papier has one voice.
      return (
        <span
          style={{
            fontSize: "1.75em",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "lining-nums",
          }}
        >
          {mark.text}
        </span>
      );
    case "plusMinus":
      // The thousand it gives over the thousand it takes, with a rule between
      // them: it is one exchange, not two numbers.
      return (
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            fontSize: "0.8em",
            lineHeight: 1.15,
            fontVariantNumeric: "lining-nums",
          }}
        >
          <span>+1000</span>
          <span
            style={{ height: 1, background: "currentColor", opacity: 0.5 }}
          />
          <span>−1000</span>
        </span>
      );
    case "stopSign":
      // A true regular octagon — the old one was an eight-sided rounded square
      // — with the bar drawn heavier than the outline, because the bar is the
      // meaning.
      return (
        <Symbol>
          <g style={stroke(1.9)}>
            <path
              d="M8.7 2h6.6L20 6.7v6.6L15.3 18H8.7L4 13.3V6.7Z"
              transform="translate(0 2)"
            />
          </g>
          <path d="M7.4 14h9.2" style={stroke(2.6)} />
        </Symbol>
      );
    case "burst":
      // Rays of two lengths off a solid centre, which is what a firework looks
      // like a moment after it opens. The old one had eight identical spokes
      // and read as a compass rose.
      return (
        <Symbol>
          <g style={stroke(1.7)}>
            <path d="M12 1.6v5M12 17.4v5M1.6 12h5M17.4 12h5" />
            <path d="M4.9 4.9l2.6 2.6M16.5 16.5l2.6 2.6M19.1 4.9l-2.6 2.6M7.5 16.5l-2.6 2.6" />
          </g>
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </Symbol>
      );
    case "run":
      // The run itself: 1 through 6, standing on a rule, drawn by the same pip
      // grid as the dice in the hand — so a die on a Card is the die the Player
      // is holding. The rule under them is what makes it a sequence rather than
      // six loose dice, and it is the one thing this mark was missing.
      return (
        <span
          aria-hidden
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.1em",
          }}
        >
          {ALL_FACES.map((face) => (
            <span
              key={face}
              style={{
                position: "relative",
                width: "0.62em",
                height: "0.62em",
                borderRadius: "0.1em",
                boxShadow: "inset 0 0 0 1px currentColor",
              }}
            >
              <Pips face={face} colour="currentColor" size="76%" />
            </span>
          ))}
        </span>
      );
    case "clover":
      // Four leaves and a stem. The leaves are drawn as outlines here, not
      // solid discs: a solid clover at this size on paper is a blot.
      return (
        <Symbol>
          <g fill="currentColor">
            <circle cx="15.7" cy="7" r="4.3" />
            <circle cx="15.7" cy="14.5" r="4.3" />
            <circle cx="8.3" cy="14.5" r="4.3" />
            <circle cx="8.3" cy="7" r="4.3" />
          </g>
          <path style={stroke(1.5)} d="M12 16.2c.5 3 0 4.8-1.6 6.1" />
        </Symbol>
      );
  }
}

/* ------------------------------------------------------------------ faces -- */

const shell: CSSProperties = {
  position: "relative",
  width: "var(--card-width)",
  height: "var(--card-height)",
  // Every measurement on the face is in its own em, so a Card shrinks as one
  // printed object rather than bursting its frame — the original's trick, kept.
  fontSize: "calc(var(--card-height) / 6)",
  fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  borderRadius: 3,
  overflow: "hidden",
  flex: "none",
};

const stack: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.16em",
};

/** The index in both corners, the way a playing card carries it. */
function Corners({
  text,
  colour,
  hideTop = false,
}: {
  text: string;
  colour: string;
  /**
   * Drop the upper index. A face with a band across its head already carries the
   * Card's name up there, and an index beside it is the same word twice — the
   * argument `Card.tsx` makes for keeping the name *below* the mark rather than
   * above it, applied to the corner instead.
   */
  hideTop?: boolean;
}) {
  const base: CSSProperties = {
    position: "absolute",
    fontSize: "0.34em",
    letterSpacing: "0.08em",
    lineHeight: 1,
    color: colour,
  };
  return (
    <>
      {!hideTop && (
        <span aria-hidden style={{ ...base, top: "0.5em", left: "0.55em" }}>
          {text}
        </span>
      )}
      <span
        aria-hidden
        style={{
          ...base,
          right: "0.55em",
          bottom: "0.5em",
          transform: "rotate(180deg)",
        }}
      >
        {text}
      </span>
    </>
  );
}

/**
 * CA — Gestochen. A paper card and nothing else: the ground stays the page, the
 * frame is a drawn hairline, and the rulebook's colour is spent only where it is
 * read — the mark's own ink, the corner indices, and one short rule under the
 * name. The most restrained of the three and the most obviously the same
 * material as the table it lies on.
 */
function Gestochen({ card }: { card: Card }) {
  const { colour, name, mark, corner } = cardFace(card);
  const press = PRESS[colour];
  return (
    <div
      style={{
        ...shell,
        background: PAPER,
        boxShadow: `inset 0 0 0 1.5px ${INK}`,
      }}
    >
      {/* The inner frame, as the original had it — a second line inside the
          first is most of what makes a rectangle read as printed. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: "0.3em",
          border: `1px solid ${RULE}`,
          borderRadius: 2,
        }}
      />
      <Corners text={corner} colour={press.ink} />
      <div style={{ ...stack, color: press.ink }}>
        <CardMarkArt mark={mark} />
        {name !== null && (
          <>
            <span
              style={{
                width: "1.6em",
                height: 1,
                background: press.ink,
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontSize: "0.34em",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: INK,
              }}
            >
              {name}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * CD — Gestochen in Farbe, and this is the one that was chosen: Gestochen's
 * drawing on Farbfeld's ground.
 *
 * Everything that made Gestochen the best-drawn card stays — the double frame,
 * the short rule between the mark and the name, the name in letter-spaced small
 * caps, the index in both corners — and the ground stops being paper. That is the
 * whole of the change, and it is the right way round: Gestochen was losing the
 * colour a Player identifies the Card by, and Farbfeld was carrying that colour on
 * a plainer card.
 *
 * Two inks on the face, which is deliberate. The mark, the frame and the indices
 * are the Card's own colour, because they are what says *which* Card this is; the
 * name under the rule is the page's ink, because it is a word to be read. One ink
 * for both left the name competing with the mark for the same attention.
 */
function GestochenFarbe({ card }: { card: Card }) {
  const { colour, name, mark, corner } = cardFace(card);
  const press = PRESS[colour];
  return (
    <div
      style={{
        ...shell,
        background: press.wash,
        boxShadow: `inset 0 0 0 1.5px ${press.ink}`,
      }}
    >
      {/* The inner frame, as Gestochen had it — a second line inside the first is
          most of what makes a rectangle read as printed. In the Card's colour
          here rather than in the page's rule grey, which on a tinted ground read
          as a smudge. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: "0.3em",
          border: `1px solid ${press.ink}`,
          opacity: 0.35,
          borderRadius: 2,
        }}
      />
      <Corners text={corner} colour={press.ink} />
      <div style={{ ...stack, color: press.ink }}>
        <CardMarkArt mark={mark} />
        {name !== null && (
          <>
            <span
              style={{
                width: "1.6em",
                height: 1,
                background: press.ink,
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontSize: "0.34em",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: INK,
              }}
            >
              {name}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * CB — Banderole. A paper card with a printed band across its head carrying the
 * name reversed out of the rulebook's colour. The colour is unmistakable at a
 * glance and still touches only a fifth of the card, so the mark below it is
 * read on paper. The band is also where the name belongs on a card you see the
 * top edge of first, coming off a deck.
 */
function Banderole({ card }: { card: Card }) {
  const { colour, name, mark, corner } = cardFace(card);
  const press = PRESS[colour];
  return (
    <div
      style={{
        ...shell,
        background: PAPER,
        boxShadow: `inset 0 0 0 1.5px ${INK}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1.05em",
          background: press.ink,
          color: PAPER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.34em",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {name ?? corner}
        </span>
      </div>
      <Corners text={corner} colour={QUIET} hideTop />
      <div style={{ ...stack, color: INK, paddingTop: "1.05em" }}>
        <CardMarkArt mark={mark} />
      </div>
    </div>
  );
}

/**
 * CC — Farbfeld. The whole ground tinted with the Card's own colour and the type
 * and mark set in ink on it — the closest of the three to the original, and the
 * only one where the colour is the first thing you see rather than a detail on a
 * white card. A wash and not the saturated ground: a fully saturated card on this
 * page is the thing the ground round rejected.
 */
function Farbfeld({ card }: { card: Card }) {
  const { colour, name, mark, corner } = cardFace(card);
  const press = PRESS[colour];
  return (
    <div
      style={{
        ...shell,
        background: press.wash,
        boxShadow: `inset 0 0 0 1.5px ${press.ink}`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: "0.3em",
          border: `1px solid ${press.ink}`,
          opacity: 0.3,
          borderRadius: 2,
        }}
      />
      <Corners text={corner} colour={press.ink} />
      <div style={{ ...stack, color: press.ink }}>
        <CardMarkArt mark={mark} />
        {name !== null && (
          <span
            style={{
              fontSize: "0.34em",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {name}
          </span>
        )}
      </div>
    </div>
  );
}

export function PaperCard({ card, style }: { card: Card; style: CardStyle }) {
  if (style === "CB") return <Banderole card={card} />;
  if (style === "CC") return <Farbfeld card={card} />;
  if (style === "CA") return <Gestochen card={card} />;
  return <GestochenFarbe card={card} />;
}

/**
 * The printed back, drawn once and worn by two things: the deck, and the Card
 * itself while it is still face-down in the middle of a deal. Sharing it is the
 * whole point — the thing that turns over has to be the thing that was lying on
 * the deck a moment ago.
 */
export function PaperCardBackFace({
  left = null,
  style,
}: {
  /** The count, on the deck. The Card in flight is one card and says nothing. */
  left?: number | null;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "block",
        position: "absolute",
        inset: 0,
        background: PAPER,
        boxShadow: `inset 0 0 0 1.5px ${INK}`,
        borderRadius: 3,
        backfaceVisibility: "hidden",
        ...style,
      }}
    >
      {/* The hatching: a printed back, ruled rather than patterned, so it is
          obviously the same press as the faces. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: "0.3em",
          border: `1px solid ${INK}`,
          borderRadius: 2,
          background: `repeating-linear-gradient(-45deg, ${INK}14 0 1px, transparent 1px 5px)`,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.2em",
        }}
      >
        <span
          style={{
            fontSize: "0.4em",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            background: PAPER,
            padding: "0.2em 0.35em",
          }}
        >
          Tutto
        </span>
        {left !== null && (
          <span
            style={{
              fontSize: "0.3em",
              letterSpacing: "0.08em",
              color: QUIET,
              background: PAPER,
              padding: "0 0.3em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {left}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * The deck: the back of a Card, and the button that draws off it.
 *
 * `pressable`: this is the draw. The whole card is the button, which is what was
 * asked for and is also what the real screen already does — `Card.tsx` makes the
 * deck a real `<button>` so the move is keyboard-reachable and focus-ringed
 * rather than a click handler on a drawing.
 */
export function PaperCardBack({
  left,
  disabled,
  onDraw,
}: {
  left: number;
  disabled: boolean;
  onDraw: () => void;
}) {
  return (
    <button
      onClick={onDraw}
      disabled={disabled}
      aria-label={`Karte ziehen, ${left} noch im Stapel`}
      className="deck"
      style={{
        ...shell,
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        padding: 0,
      }}
    >
      <PaperCardBackFace left={left} />
    </button>
  );
}

/**
 * The Card in the slot, as a thing with two sides. The deal turns it over, so it
 * has to have a back — a face rotated 180° with no back behind it shows its own
 * front mirrored, which is the one way a flip can look wrong.
 */
export function PaperCardFlip({
  card,
  style: face,
  backAxis = "y",
}: {
  card: Card;
  style: CardStyle;
  /**
   * Which way the Card is turned over, and so which way its back has to be
   * mounted. A back mounted on the wrong axis is not invisible: it comes up
   * upside down, and »TUTTO« reads as »OTTUT«.
   */
  backAxis?: "x" | "y";
}) {
  return (
    // Its own box rather than `shell`, and the difference is the whole flip:
    // `shell` clips its overflow, and an element that clips cannot hold a 3D
    // context — the back face would flatten into the front and the turn would
    // show the front mirrored instead. So this box preserves 3D and does not
    // clip; each face clips its own contents, which is where the clipping was
    // needed anyway.
    <span
      style={{
        // `block`, and it is load-bearing rather than tidiness: a `<span>` is
        // inline, an inline box ignores width and height, and the faces inside
        // this one were laying themselves out against a line box. That is what
        // made the face-down Card sit off the deck by a few pixels and come out
        // a size too big — the misalignment was never in the animation.
        display: "block",
        position: "relative",
        width: "var(--card-width)",
        height: "var(--card-height)",
        fontSize: "calc(var(--card-height) / 6)",
        flex: "none",
        transformStyle: "preserve-3d",
      }}
    >
      <span
        style={{
          display: "block",
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
        }}
      >
        <PaperCard card={card} style={face} />
      </span>
      <PaperCardBackFace
        style={{
          transform: backAxis === "x" ? "rotateX(180deg)" : "rotateY(180deg)",
        }}
      />
    </span>
  );
}
