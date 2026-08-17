import type { MarkName } from "./Mark";

/**
 * What the app can say with a tile, and what each one looks like.
 *
 * The design rests on one device — a pale wash with its number in a saturated
 * version of the same hue — and that device is only worth anything if it is
 * *stable*: the same thing has to be the same colour every time a Player sees
 * it, or the colour is decoration rather than information. So the mapping lives
 * here, once, rather than being chosen at each call site.
 *
 * Keyed by what the number **means**, never by which screen it is on. »Your
 * best Zug« is a Turn's score on the record and would be a Turn's score
 * anywhere else; it takes the same tile in both places.
 *
 * Each ink is solved to clear 4.5:1 on its own tile — see the tokens in
 * `index.css`, where the numbers are. None of these hues is a Card's: cobalt,
 * ember, fern and straw belong to the printed deck (`real-table 05`) and a
 * statistic must never read as a Card.
 */
export type Meaning =
  /** Points in play, and what a Turn was worth. */
  | "turn"
  /** A Game won, and the Seat in front. */
  | "win"
  /** A Game lost, or a Turn that came to nothing. */
  | "loss"
  /** A Game still running, waiting on somebody. */
  | "waiting"
  /** Somebody at the table. */
  | "player";

export type Tile = {
  /** The pale ground. */
  tile: string;
  /** The saturated number on it. */
  ink: string;
  /** Both together, for the well a mark sits in. */
  well: string;
  mark: MarkName;
};

export const TILE: Record<Meaning, Tile> = {
  // Violet for the Turn, because it is the number »Im Zug« already wears on the
  // play screen and the record should not rename it.
  turn: {
    tile: "bg-violet",
    ink: "text-violet-ink",
    well: "bg-violet text-violet-ink",
    mark: "die",
  },
  win: {
    tile: "bg-amber",
    ink: "text-amber-ink",
    well: "bg-amber text-amber-ink",
    mark: "crown",
  },
  loss: {
    tile: "bg-pink",
    ink: "text-pink-ink",
    well: "bg-pink text-pink-ink",
    mark: "flame",
  },
  waiting: {
    tile: "bg-sky",
    ink: "text-sky-ink",
    well: "bg-sky text-sky-ink",
    mark: "hourglass",
  },
  player: {
    tile: "bg-lime",
    ink: "text-lime-ink",
    well: "bg-lime text-lime-ink",
    mark: "person",
  },
};
