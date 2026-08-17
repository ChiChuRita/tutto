import type { GameState } from "./game/turn";

/**
 * Which dice show as picked up, on whichever phone is asking.
 *
 * Two devices ask this and get their answer from different places, and that
 * asymmetry is the point. The Player choosing reads their own hand: the die
 * under the thumb turns blue in the frame it was tapped in, whatever the
 * network is doing. Everyone else reads what that phone published, so the
 * reaching, and the changing of minds, happens on their screen too.
 *
 * The published half is transient and is made transient here rather than by a
 * write. A row carries the Roll it was made in, and it is shown only while that
 * Roll is still the Roll on the table — so a highlight cannot outlive the dice
 * it points at, and no clearing message has to arrive for that to be true. A
 * phone that dies mid-choice leaves a row behind and no highlight with it.
 *
 * How often a selection is published, and by whom, is `useSelection.ts`. This
 * module only decides what to draw with what has arrived.
 */

/**
 * One Seat's row, as far as this is concerned. It is the presence row — the one
 * place transient per-Seat state lives — so most of it is nothing to do with
 * dice and a Seat that has only ever checked in carries no selection at all.
 */
export type Published = {
  /** The Seat's place in the Game's `seats`. */
  seatIndex: number;
  selection?: {
    /** The Roll it was made in, as `rollKey` names it. */
    roll: string;
    /** Places in that Roll the Player had picked up. */
    dice: number[];
  };
};

/** Nobody has picked anything up. Shared, so a re-render is not a new object. */
const NOTHING: ReadonlySet<number> = new Set();

/**
 * A Roll as the selection table names it: which Roll of the Game this is, in a
 * string, computed the same way on the phone that publishes a choice and on
 * every phone that reads one.
 *
 * The faces alone are not that, though they look like it. Within one stretch of
 * a Turn each Roll throws fewer dice than the one before it, so no two of those
 * can be confused — but a TUTTO hands all six dice back, and so does the Seat's
 * next Turn, and then a later Roll can fall exactly as an earlier one did. One
 * throw of six in 46,656. Nothing clears a published row, so on that throw a
 * watcher would light up dice nobody has picked up in the Roll on the table.
 *
 * So the faces carry the position around them, and between them the three
 * numbers cannot repeat for one Seat:
 *
 * - **the set-aside count** grows with every Roll of one stretch, because a
 *   Roll that set nothing aside would have ended the Turn;
 * - **the Turn's score** grows across a TUTTO, which is the one thing that
 *   clears the set-aside back to none mid-Turn, and a TUTTO always scores;
 * - **the Seat's Turns taken** grows when the Turn ends, which is the other
 *   thing that hands back all six.
 *
 * Faces are single digits, so nothing here can slide into its neighbour.
 * `convex/presence.ts` bounds how long the whole of it may be.
 */
export const rollKey = (state: GameState): string =>
  [
    state.turn.roll?.join("") ?? "",
    state.turn.setAside.length,
    state.turn.score,
    state.seats[state.activeSeatIndex].turnsTaken,
  ].join(":");

/** Which places of the Roll on this screen show as chosen. */
export function chosenDice(
  /**
   * This device's own choice, for the Player making it, and `null` on every
   * phone that is watching. Never the network: a slow or failed write must not
   * reach the dice under the chooser's thumb.
   */
  mine: readonly number[] | null,
  /** The table's rows, or `undefined` before the query answers. */
  published: readonly Published[] | undefined,
  /**
   * The live position, not the settled one. These dice are the animation
   * rather than its outcome — picking one up is a decision and gives nothing
   * away — so the highlight belongs with the Roll on the table.
   */
  state: GameState,
): ReadonlySet<number> {
  if (mine !== null) return new Set(mine);
  // No Roll on the table is no dice to highlight, so there is nothing a row
  // could be saying. Checked here rather than left to the keys, which would
  // otherwise let an empty Roll match an empty key.
  if (state.turn.roll === null) return NOTHING;
  const here = rollKey(state);
  // The Seat and the Roll both, because either alone lets a highlight through
  // that has nothing to do with the dice on screen: a Seat whose Turn has
  // passed, or a choice made in the Roll before this one.
  const shown = (published ?? []).find(
    (row) =>
      row.seatIndex === state.activeSeatIndex && row.selection?.roll === here,
  );
  return shown?.selection === undefined
    ? NOTHING
    : new Set(shown.selection.dice);
}
