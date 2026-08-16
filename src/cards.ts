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
  /** The one large mark on the face, and the whole of the face. */
  mark: string;
  /** The rulebook's own German for what the Card does. Reads below the card. */
  effect: string;
};

/**
 * Keyed by Card, so a Card added to the rules cannot reach the screen without a
 * face — the compiler stops it, and `cards.test.ts` stops it again.
 */
const FACES: Record<Card, CardFace> = {
  bonus200: {
    family: "bonus",
    lede: "Bonus",
    mark: "200",
    effect: "200 Extrapunkte bei TUTTO",
  },
  bonus300: {
    family: "bonus",
    lede: "Bonus",
    mark: "300",
    effect: "300 Extrapunkte bei TUTTO",
  },
  bonus400: {
    family: "bonus",
    lede: "Bonus",
    mark: "400",
    effect: "400 Extrapunkte bei TUTTO",
  },
  bonus500: {
    family: "bonus",
    lede: "Bonus",
    mark: "500",
    effect: "500 Extrapunkte bei TUTTO",
  },
  bonus600: {
    family: "bonus",
    lede: "Bonus",
    mark: "600",
    effect: "600 Extrapunkte bei TUTTO",
  },
  x2: {
    family: "multiplier",
    lede: null,
    mark: "×2",
    effect: "Bei TUTTO zählt der ganze Zug doppelt",
  },
  stop: {
    family: "forcing",
    lede: null,
    mark: "STOP",
    effect: "Der Zug ist sofort vorbei, ohne Punkte",
  },
  fireworks: {
    family: "forcing",
    lede: null,
    mark: "FEUERWERK",
    effect: "Weiterwürfeln bis zur Niete — die Punkte bleiben trotzdem",
  },
  straight: {
    family: "forcing",
    lede: null,
    // Straße uppercases to STRASSE: the conventional German form, and the one
    // place a UI string does not match the glossary letter for letter.
    mark: "STRASSE",
    effect: "Jede neue Zahl zählt. 1 bis 6 sind 2000 Punkte und ein TUTTO",
  },
  plusMinus: {
    family: "forcing",
    lede: null,
    mark: "PLUS/MINUS",
    effect:
      "TUTTO ohne aufhören: 1000 für dich, 1000 weniger für die Führenden",
  },
  cloverleaf: {
    family: "forcing",
    lede: null,
    mark: "KLEEBLATT",
    effect:
      "Zwei TUTTOs hintereinander ohne aufhören — und das Spiel ist gewonnen",
  },
};

export const cardFace = (card: Card): CardFace => FACES[card];
