import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { Published } from "./selection";

/**
 * The client half of the shared selection: this device saying which dice it has
 * picked up, and reading back what the Seat on the table has said.
 *
 * Both halves live outside the Game's own subscription. They live on the
 * presence row, which is where every piece of transient per-Seat state goes:
 * keyed by Game and Seat, written by the device that holds the Seat with its
 * secret, read raw and decided on the client.
 *
 * The read is the same query `usePresence` already runs, with the same
 * argument, so Convex serves both from one subscription and no second heartbeat
 * is sent. What it costs is that a tap now re-renders whatever else reads
 * presence — the scoreboard row — which is a cheap row of text and never the
 * dice or the Card. Nothing is written to the Game document, which is the line
 * that matters: no tap can restart a tumble or move the news along.
 */

/**
 * How long a tap waits for the taps behind it. Someone picking up four dice in
 * a second sends one message, not four, and 150ms is under what a Player can
 * see: the watcher's screen still moves while the chooser's hand is moving.
 */
export const PUBLISH_AFTER_MS = 150;

/**
 * Say which dice this device has picked up, while it is the one choosing.
 *
 * A side effect of choosing and never its source: nothing here is rendered
 * from, nothing here is waited on, and a write that fails is dropped without a
 * word — the Player's own dice come from their own state either way, and the
 * worst a lost message can do is leave a watcher a moment behind.
 *
 * Nothing is published to clear it, either. A watcher stops drawing a selection
 * when the Roll it names is no longer on the table (`selection.ts`), so the
 * dice leaving the hand, the Turn ending and the Game ending all clear it
 * without a message having to arrive for them — including from a phone that has
 * gone flat mid-choice.
 */
export function usePublishSelection(
  gameId: Id<"games">,
  /** This device's proof of its Seat (ADR 0004), or `null` if it holds none. */
  secret: string | null,
  /**
   * Whether this device is the one choosing: it holds the Seat on the table and
   * the Turn is waiting for dice to be set aside. Nobody else has anything to
   * say, and nothing they said would be drawn.
   */
  choosing: boolean,
  /** The Roll being chosen from, as `selection.ts` names it. */
  roll: string,
  /**
   * The places picked up so far. This is `useState`'s own array, so its
   * identity changes when and only when the selection does — which is what
   * makes the effect below fire once per change and not once per render.
   */
  selected: number[],
) {
  const publish = useMutation(api.presence.publishSelection);
  useEffect(() => {
    if (secret === null || !choosing) return;
    // Cleared and set again on every change, so the message goes out
    // `PUBLISH_AFTER_MS` after the last tap rather than after each one.
    const timer = setTimeout(() => {
      void publish({ gameId, secret, roll, dice: selected }).catch(() => {});
    }, PUBLISH_AFTER_MS);
    return () => clearTimeout(timer);
  }, [publish, gameId, secret, choosing, roll, selected]);
}

/**
 * Every Seat's row at this table. Which of it may be drawn is `chosenDice`'s
 * question; this only carries the rows.
 */
export function usePublishedSelections(
  gameId: Id<"games">,
): Published[] | undefined {
  return useQuery(api.presence.forGame, { gameId });
}
