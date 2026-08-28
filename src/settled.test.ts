import { describe, expect, test } from "vitest";
// The stylesheet as text. `?raw` is Vite's own way of asking for a file rather
// than what it compiles to, so there is no build step to ask and no file system
// in a test that needs neither. It wants `test.css` in `vite.config.ts`, which
// says why.
import css from "./index.css?raw";
import {
  animationMs,
  dieFlightMs,
  DRAW_MS,
  PICKUP_MS,
  TUMBLE_MS,
  tumbleMs,
} from "./settled";
import {
  applyEvent,
  CARDS,
  cardsLeft,
  newGame,
  type Card,
  type Deck,
  type GameState,
} from "./game/turn";

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

/** Whichever Card is still in the box — the deck has no order to respect. */
const anyCard = (deck: Deck): Card => CARDS.filter((card) => deck[card] > 0)[0];

/** Whatever the Card just drawn, get the Turn over with and hand the table on. */
const endTurn = (state: GameState): GameState => {
  // A Stop-Karte has already ended it.
  if (state.turn.phase === "stopCard") return play(state, { type: "nextTurn" });
  if (state.turn.card === "straight") {
    // Under a Straße a die counts when its number is not on the table yet, so
    // the only Null is a number that already is: five of the six set aside,
    // then the last die comes up one of them.
    return play(
      state,
      { type: "roll", faces: [1, 2, 3, 4, 5, 6] },
      { type: "setAside", dice: [0, 1, 2, 3, 4] },
      { type: "roll", faces: [1] },
      { type: "nextTurn" },
    );
  }
  return play(
    state,
    // No 1, no 5, no triplet: a Niete under every other Card.
    { type: "roll", faces: [2, 2, 3, 3, 4, 6] },
    { type: "nextTurn" },
  );
};

/**
 * A table that has played the box down to `left` Cards, one Card a Turn and
 * every Turn a Niete — so nobody scores, the Final round never opens and the
 * Game is still running when the deck runs out.
 */
const played = (left: number): GameState => {
  let state = table();
  while (cardsLeft(state.deck) > left) {
    state = endTurn(play(state, { type: "draw", card: anyCard(state.deck) }));
  }
  return state;
};

/**
 * `TUMBLE_MS` is how long the screen holds a Roll's news back for, and
 * `.die-tumbling` is how long the dice actually turn. They are written down
 * twice because a keyframe cannot import a constant, and this is the test both
 * comments promise: raise the keyframe alone and »Niete!« lands early, on a
 * table still moving.
 */
describe("the tumble is the same length in both places", () => {
  test("the keyframe runs for exactly TUMBLE_MS", () => {
    const rule =
      /\.die-tumbling\s*\{[^}]*animation:\s*die-tumble\s+(\d+)ms/.exec(css);
    // A rename is a mismatch too: the class the dice wear and the keyframe it
    // plays are half of the same promise as the number.
    expect(rule).not.toBeNull();
    expect(Number(rule?.[1])).toBe(TUMBLE_MS);
  });

  // The duration above is overridden inline on every die, so on its own it
  // guards a number the browser never reads. This is the line that is really
  // load-bearing, and until now nothing held it: the path is sampled at
  // nineteen stops that `throw.ts` computed, so `linear` is what makes the
  // browser's interpolation the arithmetic. Any other timing function eases an
  // already-eased curve — the release goes back to being a cut and the flop
  // lands where `DECAY` never put it — and every other test on this branch
  // would still pass.
  test("and joins the sampled path straight, or the path is not the path", () => {
    const rule =
      /\.die-tumbling\s*\{[^}]*animation:\s*die-tumble\s+\d+ms\s+(\S+)/.exec(
        css,
      );

    expect(rule).not.toBeNull();
    expect(rule?.[1]).toBe("linear");
  });
});

/**
 * The deck fills out as the played pile settles onto it, so the two are one
 * event: the pick-up leaves a full deck rather than arriving at one. The pile
 * flies from the library and the deck's edges slide in CSS, so the length is
 * written twice — and this is what keeps the second from drifting off the
 * first.
 */
describe("the deck refills for exactly as long as the pick-up flies", () => {
  test("the deck declares PICKUP_MS", () => {
    // Scoped to the rule that declares it, exactly as the tumble's guard is:
    // the property on some other selector is not the deck's refill, and a
    // renamed `.card-stack` is a mismatch the same way a changed number is.
    const rule = /\.card-stack\s*\{[^}]*--deck-refill:\s*(\d+)ms/.exec(css);

    expect(rule).not.toBeNull();
    expect(Number(rule?.[1])).toBe(PICKUP_MS);
  });

  test("the settling edges transition on it", () => {
    // The number alone guards nothing: `.card-stack-settling` is both the
    // reduced-motion gate and the only thing that applies the transition, so
    // deleting the transition, hardcoding another length into it or renaming
    // the class all leave the deck popping while the declaration above still
    // reads 300ms.
    expect(css).toMatch(
      /\.card-stack-settling\s+\.card-stack-layer\s*\{[^}]*transition:\s*transform\s+var\(--deck-refill\)/,
    );
  });
});

/**
 * Six dice and not one die drawn six times, on the way down. Each die leaves in
 * its own slot and turns for its own length, both from its place in the hand and
 * from nothing else — so two phones replaying the same Roll play the same one
 * (ADR 0001).
 */
describe("a Roll comes down as six separate dice", () => {
  const hand = [0, 1, 2, 3, 4, 5];

  test("the six leave together and land at six different moments", () => {
    // The bug the landing order replaces: it was `(index + face) % 6`, so a
    // hand whose faces repeated put pairs in the same place and the spread
    // cancelled itself out on exactly the Rolls it was there for.
    //
    // They leave together and used to leave apart. A die carries on from the
    // speed the hold left it at now (`throw.ts`), so a die holding still until
    // its slot came round would stop dead on the frame the thumb came up. What
    // the slot bought is unchanged: the first die is down at 950ms and the hand
    // at 1100ms, and nobody waits a millisecond longer for either.
    const flying = hand.map(dieFlightMs);
    // Said as figures rather than as the expression that produced them: a test
    // that restates `HAND_MS - slot × STRETCH_MS` cannot fail when either of
    // those changes, which is the one moment it is wanted.
    expect([...flying].sort((a, b) => a - b)).toEqual([
      950, 980, 1010, 1040, 1070, 1100,
    ]);
  });
});

describe("how long a Roll's tumble runs", () => {
  test("the slowest die in the hand is the one the news waits for", () => {
    // A hand of two, so the answer is a figure and not the expression under
    // test: places 0 and 1 take landing slots 0 and 3, and slot 3 is the later
    // of them. Re-deriving it with `Math.max(...map(dieFlightMs))` would be
    // spelling `tumbleMs` out and asserting it equals itself.
    expect(tumbleMs([1, 1])).toBe(1040);
    expect(tumbleMs([1])).toBe(950);
  });

  test("a hand of six still settles in the 1100ms it always did", () => {
    // The per-die length is taken off the dice that land early, so six separate
    // landings cost the Player no waiting at all: the last die down takes the
    // whole of it, and 300ms of spread plus the 800ms tumble is still the
    // figure.
    expect(tumbleMs([1, 1, 1, 1, 1, 1])).toBe(1100);
  });

  test("one die in hand is only as late as that die", () => {
    // The first slot, so nothing to wait for — and the longest tumble, because
    // the stretch goes to the dice that leave first.
    expect(tumbleMs([2])).toBe(950);
  });

  /**
   * The dice come down over the same time whether the Player wound up for ten
   * seconds or tapped. It has to be so, and the signature is what makes it so:
   * this answers from the position and from nothing else, so there is nowhere
   * for the length of a hold to get in. A watching phone never saw the hold at
   * all and has to arrive at the same number — and a settle that varied with
   * the wind-up would also be the screen telling the Player that winding up
   * changed something, which it did not.
   */
  test("the settle is the position's, so a hold cannot lengthen it", () => {
    const before = play(table(), { type: "draw", card: "bonus300" });
    const after = play(before, { type: "roll", faces: [1, 1, 1, 2, 3, 4] });
    expect(animationMs(before, after, false)).toBe(1100);
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
    // The same 400ms flight the Card takes off the pile: one gesture, one
    // number, so the row's news lands with the dice rather than 50ms early.
    expect(animationMs(before, after, false)).toBe(400);
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

  test("the last Card of the deck: the pile is picked up before it flies", () => {
    const before = played(1);
    const after = play(before, {
      type: "draw",
      card: anyCard(before.deck),
    });
    // The draw emptied the box and put all 56 back in.
    expect(cardsLeft(after.deck)).toBe(56);
    // 300ms of pile going back on the deck, then the 780ms draw off it — the
    // Card cannot come off a deck that is not there yet.
    expect(animationMs(before, after, false)).toBe(1080);
  });

  test("once that Turn has handed on, the pick-up is over", () => {
    // The deck is still full — nobody has drawn since the refill, and by
    // ADR 0005 nothing forces them to, so this position can stand for days.
    // A phone opening into it must not replay a pick-up that has already
    // happened: there is no Card in force, so the pile is not going anywhere.
    const drew = play(played(1), {
      type: "draw",
      card: anyCard(played(1).deck),
    });
    const handedOn = endTurn(drew);

    expect(cardsLeft(handedOn.deck)).toBe(56);
    expect(handedOn.turn.card).toBeNull();
    expect(handedOn.lastCard).not.toBeNull();
    expect(animationMs(null, handedOn, false)).toBe(DRAW_MS);
  });

  test("the Card before it is an ordinary draw", () => {
    const before = played(2);
    const after = play(before, { type: "draw", card: anyCard(before.deck) });
    expect(cardsLeft(after.deck)).toBe(1);
    expect(animationMs(before, after, false)).toBe(780);
  });

  test("a spent Card lying on the pile is not drawn again", () => {
    // The TUTTO spent the Card, and the Turn ending let go of it — but it never
    // moved: it is the same Card on top of the same pile the whole way through,
    // so nothing flies and nothing waits.
    const before = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 5] },
      { type: "setAside", dice: [0, 1, 2, 3, 4] },
      { type: "roll", faces: [1] },
      { type: "setAside", dice: [0] },
      { type: "stop" },
    );
    const after = play(before, { type: "nextTurn" });

    expect(after.turn.card).toBeNull();
    expect(after.lastCard).toBe("bonus300");
    expect(animationMs(before, after, false)).toBe(0);
  });

  test("a screen opening on a spent Card still owes it its flight", () => {
    // No Card is in force — the TUTTO spent it — but one is lying face-up on
    // the pile, and mounting it is what plays the draw. A screen that has just
    // opened plays every animation from its own first frame.
    const opened = play(
      table(),
      { type: "draw", card: "bonus300" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 5] },
      { type: "setAside", dice: [0, 1, 2, 3, 4] },
      { type: "roll", faces: [1] },
      { type: "setAside", dice: [0] },
    );

    expect(opened.turn.phase).toBe("awaitingCard");
    expect(animationMs(null, opened, false)).toBe(DRAW_MS);
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

/**
 * The Roll that wins the Game is the one it matters most to watch, and the
 * result screen is the biggest spoiler the app has: it replaces the play screen
 * outright. So the ending is news like any other, and these are the two shapes
 * an ending comes in.
 */
describe("the end of the Game", () => {
  /** The last Turn of the Final round, ended by a Niete nobody has seen yet. */
  const endedOnARoll = () =>
    play(
      table(),
      // Two TUTTOs under an x2 apiece is the shortest road to 6000 the rules
      // allow: 2000 doubled, then 6000 doubled.
      { type: "draw", card: "x2" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 1] },
      { type: "setAside", dice: [0, 1, 2, 3, 4, 5] },
      { type: "draw", card: "x2" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 1] },
      { type: "setAside", dice: [0, 1, 2, 3, 4, 5] },
      // Banking 12000 opens the Final round, and Ben's one Turn closes it.
      { type: "stop" },
      { type: "nextTurn" },
      { type: "draw", card: "bonus300" },
      // The Niete levels the Turn counts, which ends the Game on the spot.
      { type: "roll", faces: [2, 2, 3, 3, 4, 4] },
    );

  test("levelling the Turn counts is not itself an animation", () => {
    const ended = endedOnARoll();
    expect(ended.phase).toBe("over");
    // The Roll that ended it was already on the table and already watched: the
    // Seat that rolled it could not have tapped »Neuer Zug« before it landed.
    const before = { ...ended, phase: "finalRound" as const };
    expect(animationMs(before, ended, false)).toBe(0);
  });

  test("a screen opening on the winning Roll replays it first", () => {
    const ended = endedOnARoll();
    // The finished Turn stays on the table, so the dice that ended the Game are
    // still in the position — and a reload owes them their tumble before it
    // says who won.
    expect(ended.turn.roll).toEqual([2, 2, 3, 3, 4, 4]);
    expect(animationMs(null, ended, false)).toBe(tumbleMs([2, 2, 3, 3, 4, 4]));
  });

  test("a Kleeblatt wins with the dice it took off the table", () => {
    const won = play(
      table(),
      { type: "draw", card: "cloverleaf" },
      { type: "roll", faces: [1, 1, 1, 1, 1, 1] },
      { type: "setAside", dice: [0, 1, 2, 3, 4, 5] },
      { type: "roll", faces: [1, 1, 1, 1, 1, 5] },
      { type: "setAside", dice: [0, 1, 2, 3, 4] },
      { type: "roll", faces: [1] },
      { type: "setAside", dice: [0] },
    );
    expect(won.phase).toBe("over");
    expect(won.turn.phase).toBe("won");
    // The second TUTTO is the win, and a TUTTO hands every die back — so the
    // dice that won are gone from the position and the move itself has nothing
    // new to play. What holds the result screen back at the table is the
    // deadline the winning Roll already set, which is why the wait is a
    // deadline and not a timer per event.
    const before = { ...won, phase: "playing" as const };
    expect(animationMs(before, won, false)).toBe(0);
    // A screen opening on it still has the Kleeblatt to lay down and turn over,
    // and that is the whole of the story left in the position.
    expect(animationMs(null, won, false)).toBe(DRAW_MS);
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
