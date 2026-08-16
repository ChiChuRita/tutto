import type { Card } from "./game/turn";

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

export type CardFace = {
  family: CardFamily;
  /** The small word above a bare number, where the number alone says nothing. */
  lede: string | null;
  /**
   * The one large mark on the face, and the whole of the face — one entry per
   * line. The mark is set as large as its longest line will go across the card,
   * and the card is narrow, so where a long name breaks is a decision rather
   * than something a browser is asked to work out. See `MARK_LINE`.
   */
  mark: string[];
  /**
   * The mark small in the corners, the way a playing card carries its indices.
   * Derived, never written down — see `CORNER_LENGTH`.
   */
  corner: string;
  /** The rulebook's own German for what the Card does. Reads below the card. */
  effect: string;
};

/**
 * The most characters a line of the mark may hold. The card is about 4rem
 * across, and 0.72em per capital in Arial bold means five is roughly 14px —
 * the floor at which the value still reads as the value. A nine-cap word cannot
 * be both on one line and legible at this width, so the long names break, and
 * the break goes where the German does: at the compound seam (FEUER·WERK,
 * KLEE·BLATT), after the slash, or on a hyphen where the word hyphenates
 * (STRA-SSE). `cards.test.ts` holds every Card to it.
 */
export const MARK_LINE = 5;

/**
 * How much of the mark the corner index carries. Four is what stays legible at
 * index size. It is a blunt cut of the mark's first line rather than a chosen
 * abbreviation, so the rule needs no judgement and a Card added later cannot
 * get it wrong — and no Card can end up wearing a symbol out of some other
 * alphabet, which is what »±« for PLUS/MINUS was.
 */
const CORNER_LENGTH = 4;

/** The face as it is written down. The corner is worked out from the mark. */
type CardDesign = Omit<CardFace, "corner">;

/**
 * Keyed by Card, so a Card added to the rules cannot reach the screen without a
 * face — the compiler stops it, and `cards.test.ts` stops it again.
 */
const FACES: Record<Card, CardDesign> = {
  bonus200: {
    family: "bonus",
    lede: "Bonus",
    mark: ["200"],
    effect: "200 Extrapunkte bei TUTTO",
  },
  bonus300: {
    family: "bonus",
    lede: "Bonus",
    mark: ["300"],
    effect: "300 Extrapunkte bei TUTTO",
  },
  bonus400: {
    family: "bonus",
    lede: "Bonus",
    mark: ["400"],
    effect: "400 Extrapunkte bei TUTTO",
  },
  bonus500: {
    family: "bonus",
    lede: "Bonus",
    mark: ["500"],
    effect: "500 Extrapunkte bei TUTTO",
  },
  bonus600: {
    family: "bonus",
    lede: "Bonus",
    mark: ["600"],
    effect: "600 Extrapunkte bei TUTTO",
  },
  x2: {
    family: "multiplier",
    lede: null,
    mark: ["×2"],
    effect: "Bei TUTTO zählt der ganze Zug doppelt",
  },
  stop: {
    family: "forcing",
    lede: null,
    mark: ["STOP"],
    effect: "Der Zug ist sofort vorbei, ohne Punkte",
  },
  fireworks: {
    family: "forcing",
    lede: null,
    // Feuer·werk: the compound's own seam.
    mark: ["FEUER", "WERK"],
    effect: "Weiterwürfeln bis zur Niete — die Punkte bleiben trotzdem",
  },
  straight: {
    family: "forcing",
    lede: null,
    // Straße uppercases to STRASSE: the conventional German form, and the one
    // place a UI string does not match the glossary letter for letter.
    // No seam to break at, so it breaks where German hyphenates: Stra-ße.
    mark: ["STRA-", "SSE"],
    effect: "Jede neue Zahl zählt. 1 bis 6 sind 2000 Punkte und ein TUTTO",
  },
  plusMinus: {
    family: "forcing",
    lede: null,
    // The slash stays on the first line, which is where a reader breaks it.
    mark: ["PLUS/", "MINUS"],
    effect:
      "TUTTO ohne aufhören: 1000 für dich, 1000 weniger für die Führenden",
  },
  cloverleaf: {
    family: "forcing",
    lede: null,
    // Klee·blatt: the compound's own seam.
    mark: ["KLEE", "BLATT"],
    effect:
      "Zwei TUTTOs hintereinander ohne aufhören — und das Spiel ist gewonnen",
  },
};

export const cardFace = (card: Card): CardFace => ({
  ...FACES[card],
  corner: FACES[card].mark[0].slice(0, CORNER_LENGTH),
});
