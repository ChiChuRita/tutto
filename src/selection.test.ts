import { describe, expect, it } from "vitest";
import {
  applyEvent,
  newGame,
  type Face,
  type GameEvent,
  type GameState,
} from "./game/turn";
import { chosenDice, rollKey } from "./selection";

/**
 * A watcher sees the active Player reaching for dice, and the one thing that can
 * go wrong is showing a reach that is over: a highlight left on a Roll that is
 * no longer the Roll on the table. So that is what these pin, along with the
 * rule the chooser's own thumb depends on — their screen answers from their own
 * hand and never from the table.
 */

/** Anna and Bernd; Anna is up, and has just rolled these faces. */
const rolled = (faces: Face[]): GameState =>
  (
    [
      { type: "takeSeat", name: "Anna", owner: null },
      { type: "takeSeat", name: "Bernd", owner: null },
      { type: "start" },
      { type: "draw", card: "bonus200" },
      { type: "roll", faces },
    ] as const
  ).reduce<GameState>((state, event) => applyEvent(state, event), newGame());

/** Play on from a position. */
const play = (state: GameState, events: readonly GameEvent[]): GameState =>
  events.reduce<GameState>((so, event) => applyEvent(so, event), state);

describe("what a watching phone shows as chosen", () => {
  it("shows the dice the active Seat has picked up", () => {
    const state = rolled([1, 1, 1, 2, 3, 4]);
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: rollKey(state), dice: [0, 1] } }],
      state,
    );
    expect([...shown].sort()).toEqual([0, 1]);
  });

  it("shows nothing for a Seat whose Turn is over, however the faces fell", () => {
    // Bernd's last Turn left a row behind, and this Roll happens to have come
    // up the same. The dice on the table are Anna's, so the highlight is not
    // his to place.
    const state = rolled([1, 1, 1, 2, 3, 4]);
    const shown = chosenDice(
      null,
      [{ seatIndex: 1, selection: { roll: rollKey(state), dice: [3] } }],
      state,
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing for a selection made in a Roll that has been rolled away", () => {
    // Anna picked up her three 1s, set them aside and rolled the other three.
    // Her old choice is still the newest thing the table published, and the
    // dice it points at are gone.
    const before = rolled([1, 1, 1, 2, 3, 4]);
    const after = play(before, [
      { type: "setAside", dice: [0, 1, 2] },
      { type: "roll", faces: [2, 3, 5] },
    ]);
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: rollKey(before), dice: [0, 1, 2] } }],
      after,
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing for a selection made before a TUTTO handed the same faces back", () => {
    // The faces alone cannot tell these two Rolls apart. Anna's six 1s are a
    // TUTTO, which puts all six dice back in her hand, and the next Roll comes
    // up six 1s again — one throw in 46,656, and nothing has cleared the row
    // she published in the first one.
    const before = rolled([1, 1, 1, 1, 1, 1]);
    const said = rollKey(before);
    const after = play(before, [
      { type: "setAside", dice: [0, 1, 2, 3, 4, 5] },
      { type: "draw", card: "bonus200" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 1] },
    ]);
    expect(after.turn.roll).toEqual([1, 1, 1, 1, 1, 1]);
    expect(rollKey(after)).not.toBe(said);
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: said, dice: [0, 1] } }],
      after,
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing for a selection made in the same Seat's previous Turn", () => {
    // A new Turn hands back all six as well, so the same coincidence reaches
    // across Turns: Anna's Turn ends on a Niete, Bernd takes his, and Anna's
    // first Roll of the next one falls exactly as her first Roll of this one
    // did.
    const before = rolled([1, 2, 3, 4, 6, 6]);
    const said = rollKey(before);
    const after = play(before, [
      { type: "setAside", dice: [0] },
      // No 1, no 5, no triplet: the Turn is over and nothing is banked.
      { type: "roll", faces: [2, 3, 4, 6, 6] },
      { type: "nextTurn" },
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [2, 2, 3, 3, 4, 4] },
      { type: "nextTurn" },
      { type: "draw", card: "bonus400" },
      { type: "roll", faces: [1, 2, 3, 4, 6, 6] },
    ]);
    expect(after.activeSeatIndex).toBe(0);
    expect(rollKey(after)).not.toBe(said);
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: said, dice: [0] } }],
      after,
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing once the dice have left the hand", () => {
    // Set aside, and there is no Roll on the table to highlight. A row saying
    // as much is still not permission to draw one.
    const empty = applyEvent(rolled([1, 1, 1, 2, 3, 4]), {
      type: "setAside",
      dice: [0, 1, 2],
    });
    expect(empty.turn.roll).toBe(null);
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: "", dice: [0] } }],
      empty,
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing for a Seat that has only ever checked in", () => {
    // The row is shared with presence, so a Seat has one long before it has
    // picked anything up. Being here is not a choice.
    const shown = chosenDice(
      null,
      [{ seatIndex: 0 }],
      rolled([1, 1, 1, 2, 3, 4]),
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing before the table has answered", () => {
    // A phone that has just opened the Game. The dice are on screen well
    // before the selection query comes back, and an unanswered question is
    // not an empty answer.
    const shown = chosenDice(null, undefined, rolled([1, 1, 1, 2, 3, 4]));
    expect([...shown]).toEqual([]);
  });
});

describe("the chooser's own screen", () => {
  it("answers from the hand and not from the table", () => {
    // The write is still in flight, or it failed outright. Either way the die
    // under the thumb is blue, because the thumb is what decided it.
    const shown = chosenDice([2], [], rolled([1, 1, 1, 2, 3, 4]));
    expect([...shown]).toEqual([2]);
  });
});
