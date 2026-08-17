import { describe, expect, it } from "vitest";
import { applyEvent, newGame, type Face, type GameState } from "./game/turn";
import { chosenDice } from "./selection";

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

describe("what a watching phone shows as chosen", () => {
  it("shows the dice the active Seat has picked up", () => {
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: "111234", dice: [0, 1] } }],
      rolled([1, 1, 1, 2, 3, 4]),
    );
    expect([...shown].sort()).toEqual([0, 1]);
  });

  it("shows nothing for a Seat whose Turn is over, however the faces fell", () => {
    // Bernd's last Turn left a row behind, and this Roll happens to have come
    // up the same. The dice on the table are Anna's, so the highlight is not
    // his to place.
    const shown = chosenDice(
      null,
      [{ seatIndex: 1, selection: { roll: "111234", dice: [3] } }],
      rolled([1, 1, 1, 2, 3, 4]),
    );
    expect([...shown]).toEqual([]);
  });

  it("shows nothing for a selection made in a Roll that has been rolled away", () => {
    // Anna picked up her three 1s, set them aside and rolled the other three.
    // Her old choice is still the newest thing the table published, and the
    // dice it points at are gone.
    const before = rolled([1, 1, 1, 2, 3, 4]);
    const after = applyEvent(
      applyEvent(before, { type: "setAside", dice: [0, 1, 2] }),
      { type: "roll", faces: [2, 3, 5] },
    );
    const shown = chosenDice(
      null,
      [{ seatIndex: 0, selection: { roll: "111234", dice: [0, 1, 2] } }],
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
