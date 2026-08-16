# 02 — Play one Turn

**What to build:** A Player can take a complete Turn of Tutto with no Cards in play. They roll six
dice, see which are valid, set aside the ones they want, watch the Turn score build, and then
either stop and bank it or throw a Niete and lose everything from that Turn. Setting aside all six
dice is a Tutto and returns all six to the hand to continue.

This is the ticket that carries the rules. The turn engine is born here as a pure reducer taking
`(state, event) → state`, with a Roll's six faces arriving as event payload rather than being
generated inside it — which is what makes it testable without seeding randomness. Per ADR 0001 the
dice themselves are generated in a Convex mutation, which then applies the reducer and writes the
result in one transaction. The mutation holds no game logic of its own.

Dice render as plain numbers for now. Making them look good is the next ticket, deliberately kept
apart so this one is judged on whether the rules are right.

The first vitest suite lands here and sets the pattern every later test copies: feed a state and a
sequence of events, assert rulebook outcomes, never reach into how the reducer represents things.

**Blocked by:** 01 — Clear the template, add vitest

**Status:** ready-for-agent

- [x] Rolling six dice shows the result and marks which dice are valid
- [x] Singles score 100 for a 1 and 50 for a 5; triplets score 1000, 200, 300, 400, 500, 600
- [x] A triplet only counts when all three arrived in one Roll; one assembled across Rolls scores nothing
- [x] Each die counts once — a 1 within a triplet of 1s is not also counted as a single
- [x] The Player chooses which valid dice to set aside and cannot set aside a die that scores nothing
- [x] The banked score and the at-risk Turn score are shown as separate numbers
- [x] Rerolling uses only the dice not set aside
- [x] Stopping banks the Turn score
- [x] A Roll with no valid die is a Niete: it is announced, and the whole Turn score is forfeited
- [x] Setting aside all six dice is announced as a Tutto and returns all six dice to the hand
- [x] The Game survives a page refresh with the Turn in progress intact
- [x] All user-facing text is German using the rulebook's wording
- [x] The whole Turn is playable one-handed in portrait on a phone
- [x] The reducer is pure — no randomness, no I/O, no Convex imports
- [x] Tests cover the scoring table, the split-triplet case, each-die-counts-once, Niete, and Tutto
