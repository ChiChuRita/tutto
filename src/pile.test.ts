import { describe, expect, test } from "vitest";
import {
  buriedCards,
  cardsPlayed,
  deckEdges,
  DECK_EDGES,
  pickedUp,
  tiltOf,
} from "./pile";

/**
 * The played pile is as deep as the deck is short: every Card that has come off
 * the deck is lying on it. The Card in force is the top of the pile, so what is
 * left to draw underneath it is one fewer.
 */
describe("how deep the played pile is", () => {
  test("the Card in force lies on Cards played before it", () => {
    // Three Cards drawn out of 56, the third of them face-up on top.
    expect(buriedCards(53, true)).toBe(2);
  });

  test("a deep pile draws no deeper than a full one", () => {
    // Four Cards played and forty are the same picture: a pile. Drawing the
    // difference would cost fifty elements and buy nothing, which is the call
    // the deck's own stack already makes.
    expect(buriedCards(52, true)).toBe(buriedCards(16, true));
  });

  test("with no Card in force the whole pile is edges", () => {
    // A Turn waiting on its first draw, and a TUTTO that has just spent its
    // Card: nothing is face-up, so the Card that was on top is an edge like
    // the rest. The pile is the Game's and does not empty between Turns.
    expect(buriedCards(54, false)).toBe(2);
  });

  test("nothing played yet: an empty place for a Card", () => {
    expect(buriedCards(56, false)).toBe(0);
  });

  test("the reshuffle puts the pile back in the deck under the Card on it", () => {
    // Drawing the 56th Card puts all 56 back, so a full deck and a Card in
    // force are true at the same moment. The pile has just been picked up and
    // this Card is the first thing on the new one — there is nothing under it.
    expect(buriedCards(56, true)).toBe(0);
  });
});

/**
 * The pile is picked up when the deck runs out, and that is the only way a full
 * deck and a Card in force are ever true together: the Cards that were lying
 * here are the deck now, and the Card that emptied it is the only thing on the
 * new pile.
 */
describe("whether the pile has just been picked up", () => {
  test("the last Card out of the deck: the pile went back in", () => {
    expect(pickedUp(56, true)).toBe(true);
  });

  test("an untouched deck has no pile to pick up", () => {
    // The Game's first Turn, before anything has been drawn. A full deck on its
    // own says nothing — it is the Card in force that says the box was emptied.
    expect(pickedUp(56, false)).toBe(false);
  });

  test("an ordinary draw leaves the pile where it is", () => {
    expect(pickedUp(55, true)).toBe(false);
    expect(pickedUp(1, true)).toBe(false);
  });
});

/**
 * How thick the deck stands. An impression and not a gauge: the count is
 * printed on the deck and is the truth, and this only has to keep a box with
 * four Cards in it from looking like a full one.
 */
describe("how thick the deck stands", () => {
  test("a full box shows every edge it has", () => {
    expect(deckEdges(56)).toBe(DECK_EDGES);
  });

  test("a box nearly empty stands as one Card", () => {
    expect(deckEdges(4)).toBe(0);
  });

  test("fifty left is thicker than five", () => {
    expect(deckEdges(50)).toBeGreaterThan(deckEdges(5));
  });

  test("it only ever thins as Cards leave", () => {
    for (let left = 0; left < 56; left++) {
      expect(deckEdges(left)).toBeLessThanOrEqual(deckEdges(left + 1));
    }
  });

  test("nobody counts layers to work out what is left", () => {
    // A few steps across the whole box, so the thickness is read at a glance
    // and never mistaken for the number printed beside it.
    const steps = new Set(
      Array.from({ length: 57 }, (_, left) => deckEdges(left)),
    );

    expect(steps.size).toBeLessThanOrEqual(DECK_EDGES + 1);
  });

  test("never more edges than the deck has to draw", () => {
    for (let left = 0; left <= 56; left++) {
      expect(deckEdges(left)).toBeGreaterThanOrEqual(0);
      expect(deckEdges(left)).toBeLessThanOrEqual(DECK_EDGES);
    }
  });

  test("the pick-up lands on a thin deck and leaves a full one", () => {
    // The deck the last Card comes off, and the deck the pile becomes.
    expect(deckEdges(1)).toBe(0);
    expect(deckEdges(56)).toBe(DECK_EDGES);
  });
});

/**
 * The angle a Card comes to rest at. It follows from where the Card lies in the
 * pile and from nothing else — no clock, no randomness, no render — so every
 * phone at the table draws the same pile and re-rendering one does not deal it
 * again.
 */
describe("the angle a Card lands at", () => {
  test("how many Cards are lying on the pile is how many left the deck", () => {
    expect(cardsPlayed(56)).toBe(0);
    expect(cardsPlayed(53)).toBe(3);
  });

  test("the same place is the same angle, asked twice or asked twice over", () => {
    expect(tiltOf(cardsPlayed(51))).toBe(tiltOf(cardsPlayed(51)));
  });

  test("a Card keeps its angle when the next one lands on it", () => {
    // Five Cards played and this one on top; a draw later there are six and it
    // is the one underneath. Same Card, same angle — it settles, it does not
    // turn.
    const onTop = tiltOf(cardsPlayed(51));
    const underneath = tiltOf(cardsPlayed(50) - 1);

    expect(underneath).toBe(onTop);
  });

  test("neighbours lie at different angles, so both edges show", () => {
    for (let played = 0; played < 24; played++) {
      expect(tiltOf(played)).not.toBe(tiltOf(played + 1));
    }
  });

  test("dealt, not scattered: a few degrees, and never square", () => {
    for (let played = 0; played <= 56; played++) {
      expect(Math.abs(tiltOf(played))).toBeGreaterThan(0);
      expect(Math.abs(tiltOf(played))).toBeLessThanOrEqual(5);
    }
  });
});
