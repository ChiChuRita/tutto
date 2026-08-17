import type { Card, Turn } from "./game/turn";

/**
 * The Card in force — the one the Turn is playing under, and so the only one
 * the screen is allowed to speak about. `null` while none is.
 *
 * Not the same question as what is lying face-up on the pile, which is
 * `cardOnTop`: a Card stops being in force the moment it is spent, and goes on
 * lying there until another lands on it. This is the narrower of the two.
 *
 * A Card owed is a Card gone: a Turn waiting on a Card has nothing in force,
 * however much the position still carries. A TUTTO spends the Card it was
 * reached under and the reducer keeps it only to score with, so the phase is
 * what says whether a Card is in force and `turn.card` is not.
 *
 * One rule and not a copy per reader. Two ask it: the sentence under the pile,
 * which names the Card the Turn is playing under, and the pick-up, which plays
 * only while the Turn that emptied the deck still holds what it drew.
 */
export const cardInForce = (turn: Turn): Card | null =>
  turn.phase === "awaitingCard" ? null : turn.card;

/**
 * The Card lying face-up on top of the played pile, or `null` for a pile with
 * nothing on it yet.
 *
 * Not `cardInForce`, and the difference is the whole of this ticket: a Card
 * that is spent is still lying on the table. At the start of a Turn and just
 * after a TUTTO nothing is in force, and the Card played last is still the face
 * on top — it stays there until somebody plays another, which is what a table
 * looks like.
 *
 * So the Turn's own Card while it is holding one, and the Game's `lastCard`
 * once it has let go. The two are never the same Card: the reducer moves one
 * into the other in the same move that the Turn stops holding it.
 */
export const cardOnTop = (turn: Turn, lastCard: Card | null): Card | null =>
  turn.card ?? lastCard;

/**
 * The Card face-up under the top of the pile, or `null` when the position does
 * not hold it — which is a real answer and not a missing one. Once the Turn has
 * let its Card go, the Card *under* the newest one played is one the Game no
 * longer keeps (ADR 0007), and it is drawn as the blank edge it is rather than
 * as the Card the position happens to still be carrying.
 *
 * That is the visible cost the pile pays at the end of every Turn: the last
 * Card played moves up to be the face on top, and the face that was under it
 * blanks to an edge where it lies — same place, same angle, nothing moving.
 */
export const cardBeneath = (turn: Turn, lastCard: Card | null): Card | null =>
  turn.card === null ? null : lastCard;

/**
 * What a Card does to you — the split that matters once a Turn is running. A
 * Bonus or the Multiplier only changes what the Turn is worth, while a Forcing
 * Card takes the choice to Stop away, so the two read apart at a glance.
 *
 * This is not the reducer's `FORCING` list, which is narrower on purpose: that
 * one answers "may this Player stop right now", and a Stop Card has already
 * ended the Turn by then while a Straße never lets you stop before the sixth
 * number. Both belong to the Forcing family the Player sees.
 */
export type CardFamily = "bonus" | "multiplier" | "forcing";

/**
 * The one large thing in the middle of the Card, and what it means rather than
 * what it is called. A number means itself; the rest are drawn, one arm per
 * kind in `Card.tsx`, so a kind added here is a compile error until there is
 * something to draw for it.
 *
 * The Bonus Cards and ×2 keep a numeral, because there the number *is* the
 * meaning and an ornament would cost the instant read for nothing.
 */
export type CardMark =
  | { kind: "number"; text: string }
  /** The thousand it gives over the thousand it takes. */
  | { kind: "plusMinus" }
  /** The road sign: an octagon, barred. */
  | { kind: "stopSign" }
  | { kind: "burst" }
  /** The run itself — the six dice faces, 1 through 6. */
  | { kind: "run" }
  | { kind: "clover" };

export type CardFace = {
  family: CardFamily;
  /**
   * The Card's German name, in small type. The middle of the Card says what
   * happens; this says what to call it. `null` only where the mark already is
   * the name — nobody says anything but "×2" for ×2.
   */
  name: string | null;
  mark: CardMark;
  /**
   * The index in the corners, the way a playing card carries it. Derived, never
   * written down — see `cornerOf`.
   */
  corner: string;
  /** The rulebook's own German for what the Card does. Reads below the card. */
  effect: string;
};

/**
 * How much of the name the corner index carries. Four is what stays legible at
 * index size.
 */
const CORNER_LENGTH = 4;

/** The face as it is written down. The corner is worked out from the rest. */
type CardDesign = Omit<CardFace, "corner">;

/**
 * The index a Card wears in its corners: the numeral where the face is a
 * numeral, and otherwise the name cut to four. A blunt cut rather than a chosen
 * abbreviation, so a Card added later cannot get it wrong — and in particular
 * cannot end up wearing a symbol out of some other alphabet, which is what »±«
 * for PLUS/MINUS was. A drawn mark with no name would leave the corner empty,
 * and `cards.test.ts` refuses that.
 */
const cornerOf = ({ mark, name }: CardDesign): string =>
  mark.kind === "number"
    ? mark.text
    : (name ?? "").toUpperCase().slice(0, CORNER_LENGTH);

/**
 * Keyed by Card, so a Card added to the rules cannot reach the screen without a
 * face — the compiler stops it, and `cards.test.ts` stops it again.
 */
const FACES: Record<Card, CardDesign> = {
  bonus200: {
    family: "bonus",
    name: "Bonus",
    mark: { kind: "number", text: "200" },
    effect: "200 Extrapunkte bei TUTTO",
  },
  bonus300: {
    family: "bonus",
    name: "Bonus",
    mark: { kind: "number", text: "300" },
    effect: "300 Extrapunkte bei TUTTO",
  },
  bonus400: {
    family: "bonus",
    name: "Bonus",
    mark: { kind: "number", text: "400" },
    effect: "400 Extrapunkte bei TUTTO",
  },
  bonus500: {
    family: "bonus",
    name: "Bonus",
    mark: { kind: "number", text: "500" },
    effect: "500 Extrapunkte bei TUTTO",
  },
  bonus600: {
    family: "bonus",
    name: "Bonus",
    mark: { kind: "number", text: "600" },
    effect: "600 Extrapunkte bei TUTTO",
  },
  x2: {
    family: "multiplier",
    name: null,
    mark: { kind: "number", text: "×2" },
    effect: "Bei TUTTO zählt der ganze Zug doppelt",
  },
  stop: {
    family: "forcing",
    name: "Stop-Karte",
    mark: { kind: "stopSign" },
    effect: "Der Zug ist sofort vorbei, ohne Punkte",
  },
  fireworks: {
    family: "forcing",
    name: "Feuerwerk",
    mark: { kind: "burst" },
    effect: "Weiterwürfeln bis zur Niete — die Punkte bleiben trotzdem",
  },
  straight: {
    family: "forcing",
    name: "Straße",
    mark: { kind: "run" },
    effect: "Jede neue Zahl zählt. 1 bis 6 sind 2000 Punkte und ein TUTTO",
  },
  plusMinus: {
    family: "forcing",
    name: "Plus/Minus",
    mark: { kind: "plusMinus" },
    effect:
      "TUTTO ohne aufhören: 1000 für dich, 1000 weniger für die Führenden",
  },
  cloverleaf: {
    family: "forcing",
    name: "Kleeblatt",
    mark: { kind: "clover" },
    effect:
      "Zwei TUTTOs hintereinander ohne aufhören — und das Spiel ist gewonnen",
  },
};

export const cardFace = (card: Card): CardFace => ({
  ...FACES[card],
  corner: cornerOf(FACES[card]),
});
