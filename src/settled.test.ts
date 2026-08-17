import { describe, expect, test } from "vitest";
import { animationMs, tumbleMs } from "./settled";
import { applyEvent, newGame, type GameState } from "./game/turn";

/**
 * Real positions out of the reducer, never hand-built: what the screen is
 * playing has to follow from a Game somebody could actually have played.
 */
const table = (): GameState => {
  const seated = ["Anna", "Ben"].reduce<GameState>(
    (state, name) => applyEvent(state, { type: "takeSeat", name, owner: null }),
    newGame(),
  );
  return applyEvent(seated, { type: "start" });
};

const play = (
  state: GameState,
  ...events: Parameters<typeof applyEvent>[1][]
) => events.reduce(applyEvent, state);

describe("how long a Roll's tumble runs", () => {
  test("the last die to start is the one the news waits for", () => {
    // Six 1s: the sixth die's seed lands back on no delay, and the fifth is the
    // late one — 800ms of tumble after 300ms of waiting.
    expect(tumbleMs([1, 1, 1, 1, 1, 1])).toBe(1100);
  });

  test("one die in hand is only as late as that die", () => {
    // Seed 2, so two places into the stagger: 120ms, then the 800ms tumble.
    expect(tumbleMs([2])).toBe(920);
  });
});

describe("what the news waits for", () => {
  test("a Roll: until the last die has settled", () => {
    const before = play(table(), { type: "draw", card: "bonus300" });
    const after = play(before, { type: "roll", faces: [1, 1, 1, 2, 3, 4] });
    expect(animationMs(before, after, false)).toBe(
      tumbleMs([1, 1, 1, 2, 3, 4]),
    );
  });

  test("a position that has not moved has nothing left to play", () => {
    const rolled = play(table(), { type: "draw", card: "bonus300" });
    expect(animationMs(rolled, rolled, false)).toBe(0);
  });

  test("a Card: until it has flown off the pile and turned over", () => {
    const before = table();
    const after = play(before, { type: "draw", card: "bonus300" });
    // 400ms of flight and then the 380ms flip that waits for it.
    expect(animationMs(before, after, false)).toBe(780);
  });

  test("a Stop-Karte is a Card: its news waits for the same flip", () => {
    // The Turn is over the moment it is drawn, and that is exactly the news the
    // flip is there to deliver.
    const before = table();
    const after = play(before, { type: "draw", card: "stop" });
    expect(after.turn.phase).toBe("stopCard");
    expect(animationMs(before, after, false)).toBe(780);
  });

  test("dice set aside: until they have flown into the row", () => {
    const before = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 2, 3, 4] },
    );
    const after = play(before, { type: "setAside", dice: [0, 1, 2] });
    expect(animationMs(before, after, false)).toBe(350);
  });

  test("a TUTTO clears the row, so nothing flies into it", () => {
    const before = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 5] },
      { type: "setAside", dice: [0, 1, 2, 3, 4] },
      { type: "roll", faces: [1] },
    );
    const after = play(before, { type: "setAside", dice: [0] });
    expect(after.turn.tutto).toBe(true);
    expect(after.turn.setAside).toEqual([]);
    expect(animationMs(before, after, false)).toBe(0);
  });

  test("the end of a Turn is not an animation", () => {
    const before = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 2, 3, 4] },
      { type: "setAside", dice: [0, 1, 2] },
    );
    expect(animationMs(before, play(before, { type: "stop" }), false)).toBe(0);
  });
});

describe("a screen that has just opened", () => {
  /** A reload, a Spectator arriving, a Seat whose Turn it is not. */
  const opening = (state: GameState) => animationMs(null, state, false);

  test("mid-Roll: the tumble replays, so the news waits for it again", () => {
    const rolled = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 2, 3, 4, 5, 6] },
    );
    expect(opening(rolled)).toBe(tumbleMs([1, 2, 3, 4, 5, 6]));
  });

  test("the Card and the dice mount together, and the longer one wins", () => {
    // One die in hand tumbles for 920ms, which the Card's 780ms draw fits
    // inside; the news is owed to whichever is still moving.
    const rolled = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 5] },
      { type: "setAside", dice: [0, 1, 2, 3, 4] },
      { type: "roll", faces: [2] },
    );
    expect(opening(rolled)).toBe(tumbleMs([2]));
    expect(opening(rolled)).toBeGreaterThan(780);
  });

  test("a Card face-up and no dice on the table: only the draw replays", () => {
    const drawn = play(table(), { type: "draw", card: "bonus300" });
    expect(opening(drawn)).toBe(780);
  });

  test("dice already in the row do not fly, so only the Card replays", () => {
    // The hand they came out of was never on this screen, so there is nowhere
    // to fly from — `takeoffs` says the same thing with an empty hand. What is
    // left to wait for is the Card, and only the Card.
    const between = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 2, 3, 4] },
      { type: "setAside", dice: [0, 1, 2] },
    );
    expect(between.turn.setAside).toHaveLength(3);
    expect(opening(between)).toBe(780);
  });
});

describe("reduced motion", () => {
  test("there is no animation to protect, so there is no lag", () => {
    const before = play(table(), { type: "draw", card: "bonus300" });
    const after = play(before, { type: "roll", faces: [1, 1, 1, 2, 3, 4] });
    expect(animationMs(before, after, true)).toBe(0);
    expect(animationMs(null, after, true)).toBe(0);
  });
});
