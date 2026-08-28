import type { MarkName } from "./Mark";

/**
 * What the app can say with a figure, and how that figure is set.
 *
 * This module used to hold five hues — a pale wash with its number in a
 * saturated version of the same colour, one per kind of number — and the whole
 * argument for it was *stability*: the same thing has to look the same every
 * time a Player sees it, or the colour is decoration rather than information.
 * That argument was right and it survives. What changed is what carries it.
 *
 * On the Tippschein ground there is exactly one coloured thing in the app and it
 * is a Card (`index.css`). A statistic in five hues either invents a sixth,
 * seventh and eighth colour for the sheet, or it borrows the deck's — and
 * borrowing the deck's is the failure mode the old file explicitly wrote itself
 * against: »a statistic must never read as a Card«. Both roads are closed, so
 * the hue goes.
 *
 * What replaces it is what a form uses: a **legend** naming the field and a
 * **drawn mark** identifying it. That is not a downgrade of the information — the
 * mark was already here and already stable, keyed by meaning rather than by
 * screen. It is the hue that was redundant. »Bester Zug« is a Turn's score
 * wherever it appears, and it takes the die mark in both places, exactly as it
 * used to take the violet.
 *
 * So `tile`, `ink` and `well` all resolve to the sheet's own field vocabulary and
 * are the same for every meaning. They are kept as fields rather than deleted
 * because a call site asking for the shape of a figure should keep getting an
 * answer from one place. This sentence used to count those call sites and the
 * count was wrong, so it no longer states one.
 *
 * A mark is not free, though, and two lists have stopped asking for one: an icon
 * that is the same on every row of a list is 44px spent on nothing, which is the
 * argument above with »hue« swapped for »mark«. What is left names a figure among
 * unlike ones (`Stats.tsx`, `Account.tsx`) or varies down the list it is in
 * (`Game.tsx`, where the winner is drawn differently).
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
  /** The field a figure stands in. */
  tile: string;
  /** The figure itself. */
  ink: string;
  /** Both together, for the well a mark sits in. */
  well: string;
  mark: MarkName;
};

/**
 * The one field treatment, said once. A machine field with the grid's rule round
 * it, and the figure in the ink — which is every figure in this app, because a
 * form does not print its totals in colour.
 */
const FIELD: Omit<Tile, "mark"> = {
  tile: "bg-lifted",
  ink: "text-ink",
  well: "bg-lifted text-ink",
};

export const TILE: Record<Meaning, Tile> = {
  turn: { ...FIELD, mark: "die" },
  win: { ...FIELD, mark: "crown" },
  loss: { ...FIELD, mark: "flame" },
  waiting: { ...FIELD, mark: "hourglass" },
  player: { ...FIELD, mark: "person" },
};
