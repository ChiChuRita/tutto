# Spec: Single-player Tutto — rules engine and dice animation

Status: ready-for-agent

## Problem Statement

There is no way to play Tutto on a phone. The game is a physical box — 6 dice, 56 cards, and
paper and pencil for scoring. Playing it means everyone being in the same room, someone keeping
score by hand, and someone remembering that a triplet only counts if it came in one Roll.

The eventual goal is playing with friends over a link. But the hard part of Tutto is not the
networking, it is the rules: seven Card types that each rewrite what a Turn means, a scoring
table with a triplet exception, Tutto chains where stopping is a live decision after every Roll,
and a Final round where reaching 6000 first does not win. None of that needs a second person to
be difficult, and all of it needs to be right before a second person is worth adding.

## Solution

A mobile web app where one Player takes Turns against themselves: draw a Card, roll six dice,
set aside what scores, decide to stop or continue, and watch a score climb toward 6000. The full
official 2024 ruleset, correct in every branch, with dice that tumble and land properly.

It is not a demo of the game — it is the game, minus the other people. When Seats and Invite
links arrive, the engine underneath does not change.

## User Stories

1. As a Player, I want to start a new Game from the app, so that I can play without setting anything up.
2. As a Player, I want a Card drawn face-up at the start of my Turn, so that I know what condition is in force before I risk anything.
3. As a Player, I want to see what the drawn Card does in plain German, so that I do not have to remember seven Card types.
4. As a Player, I want to roll all six dice at the start of a Turn, so that the Turn begins the way the physical game does.
5. As a Player, I want the dice to tumble and land on their faces, so that rolling feels like rolling and not like a number appearing.
6. As a Player, I want to see which dice in a Roll are valid, so that I can tell at a glance whether I have anything.
7. As a Player, I want to choose which valid dice to set aside, so that I can keep a single 5 instead of a triplet when that is the better play.
8. As a Player, I want to be stopped from setting aside a die that scores nothing, so that I cannot make an illegal move by mistake.
9. As a Player, I want a triplet to only count when all three came in one Roll, so that the game matches the rulebook.
10. As a Player, I want each die to count once, so that a 1 in a triplet of 1s is not also counted as a single 100.
11. As a Player, I want to see my running Turn score as I set dice aside, so that I know what I am risking.
12. As a Player, I want to reroll the dice I did not set aside, so that I can push for more points.
13. As a Player, I want to stop at any legal moment and bank my Turn score, so that I can take the safe line.
14. As a Player, I want to be told immediately when I roll a Niete, so that I understand why my Turn ended with nothing.
15. As a Player, I want a Turn that ends in a Niete to forfeit every point from that Turn, so that risk means something.
16. As a Player, I want to be told when I achieve a Tutto, so that I know all six dice are back in play.
17. As a Player, I want to choose after a Tutto whether to stop or continue, so that the central decision of the game is mine.
18. As a Player, I want continuing after a Tutto to draw a new Card, so that pushing my luck carries the risk of a Stop Card.
19. As a Player, I want a Bonus Card to add its points only if I finish with a Tutto, so that the bonus is earned and not given.
20. As a Player, I want a Bonus Card to still let me bank my rolled points if I stop without a Tutto, so that stopping is never worthless.
21. As a Player, I want an x2 Card to double my whole Turn score on a Tutto, so that the big swings are possible.
22. As a Player, I want a Stop Card to end my Turn immediately with nothing, so that the deck can punish me.
23. As a Player, I want a Fireworks Card to force me to keep rolling until a Niete, so that I lose the choice to stop.
24. As a Player, I want a Fireworks Tutto to continue without drawing a new Card, so that the Card stays in force as the rulebook says.
25. As a Player, I want a Fireworks Turn to still bank all its points when it ends, so that the forced ending is not a punishment.
26. As a Player, I want a Plus/Minus Card to require a Tutto with no option to stop, so that the Card is the gamble it is meant to be.
27. As a Player, I want a successful Plus/Minus to score exactly 1000 regardless of what I rolled, so that the Card's fixed value is respected.
28. As a Player, I want a successful Plus/Minus to deduct 1000 from the leading Seat, so that the catch-up mechanic works.
29. As a Player, I want every tied leading Seat to lose 1000 while I still gain only 1000 once, so that ties resolve the way the rulebook states.
30. As a Player, I want no Seat's score to fall below zero, so that the floor holds.
31. As a Player, I want to deduct nothing when I am the leading Seat drawing Plus/Minus, so that I am not penalised for my own Card.
32. As a Player, I want a Straight Card to change what counts as a valid die to "a number not yet set aside", so that the Card's rule replacement is honoured.
33. As a Player, I want a completed Straight to score 2000 and count as a Tutto, so that I may continue after it.
34. As a Player, I want a Straight Roll with no new number to count as a Niete, so that failing the Straight costs the Turn.
35. As a Player, I want a Cloverleaf Card to require two consecutive Tuttos with no option to stop, so that the rarest Card is the hardest.
36. As a Player, I want a completed Cloverleaf to end the Game as an immediate win at any score, so that the Card does what it promises.
37. As a Player, I want the deck to hold exactly the real distribution — 25 Bonus, 10 Stop, 5 each of Fireworks, Straight, Plus/Minus and x2, and 1 Cloverleaf — so that the odds match the physical game.
38. As a Player, I want the deck to reshuffle when exhausted, so that a long Game never runs out of Cards.
39. As a Player, I want Cards already drawn to be gone until the reshuffle, so that counting Cards is a real strategy.
40. As a Player, I want reaching 6000 to trigger a Final round rather than end the Game, so that the official ending is respected.
41. As a Player, I want the Game to end only once every Seat has taken an equal number of Turns, so that going first is not an advantage.
42. As a Player, I want the highest score to win at the end of the Final round, so that crossing 6000 first does not decide it.
43. As a Player, I want to see the result screen naming the winner and the final scores, so that the Game has an ending.
44. As a Player, I want to see my banked score and the current Turn score as separate numbers, so that I never confuse what is safe with what is at risk.
45. As a Player, I want to see how many Cards remain in the deck, so that I can judge the odds of drawing a Stop Card.
46. As a Player, I want the interface in German using the rulebook's own words, so that it reads the way the game is spoken at a table.
47. As a Player, I want the whole game to work one-handed in portrait on a phone, so that I can play it the way I would hold a phone.
48. As a Player, I want my Game to survive a page refresh, so that a mistap does not destroy my progress.
49. As a Player, I want to abandon a Game in progress, so that I can walk away without it sitting there forever.
50. As a Player, I want to see a history of my finished Games, so that the Games I play now are not lost when stats arrive later.
51. As a developer, I want the rules to be a pure reducer, so that I can test every branch of the rulebook without a database or a browser.
52. As a developer, I want dice values to enter the reducer as input, so that no test needs a seeded random number generator.
53. As a developer, I want the reducer to handle any number of Seats from the start, so that the multiplayer-only rules are tested before multiplayer exists.
54. As a developer, I want every completed Turn recorded in full, so that stats become a query rather than a migration.

## Implementation Decisions

**The turn engine is a pure reducer.** `(state, event) → state`, with no I/O, no randomness, and no
Convex imports. A Roll's six faces arrive as event payload. This is the one test seam, and it is
where essentially all the difficulty of this spec lives.

**The reducer is multi-Seat from day one; only the UI is single-player.** Plus/Minus deducting
from the leading Seat, and the Final round equalising Turn counts, are meaningless with one Seat
and would go untested if the state shape assumed a solo Player. The state holds an array of Seats;
the first slice's UI simply creates a Game with one. This costs almost nothing now and avoids
reshaping the core state when Invite links arrive.

**Convex mutations are thin.** A mutation generates the dice, applies the reducer, and writes the
result. Roll generation, validation, and scoring land in a single transaction, per ADR 0001. No
game logic lives in a mutation beyond calling the reducer.

**Dice are generated server-side; the animation is a replay.** Per ADR 0001, the client never
produces a random number. The animation receives six already-decided faces and must land on them.

**The animation is CSS 3D transforms.** Each die is a cube with six faces, tumbling along a
randomised path and settling on its given face. No physics engine, no 3D library. It is
structurally incapable of landing on the wrong face, and it is GPU-composited so it stays smooth
on a mid-range phone. Swapping in real physics later does not change the server contract.

**The deck is remaining counts, not a shuffled order.** Per ADR 0003. A draw picks
weighted-randomly from what remains, inside the mutation. Exhausting the counts resets them to the
full 56-Card distribution, which is the reshuffle. Nothing about the deck's future exists to leak.

**Live state and history are separate.** The Game document holds only what is needed to render the
current position — Seats and scores, the Card in force, dice in hand, dice set aside, Turn score,
whose Turn it is, Final round status. Completed Turns go to a `turns` table indexed by Game. Every
Seat subscribes to the Game document, so anything parked there is re-pushed to every device on
every change; history on that document would grow the payload with every Roll.

**A recorded Turn is a full replay.** Cards drawn, every Roll's six faces, what was set aside at
each step, each Tutto, and how the Turn ended — stopped, Niete, Stop Card, or abandoned. This is
what makes every future stat a query instead of a schema change.

**The UI is German, the code is English.** Identifiers, comments, and the glossary stay English;
user-facing strings are the rulebook's German words, per the wording table in `CONTEXT.md`. No i18n
library and no translation files — strings live in the components.

**Scoring constants stay hardcoded.** No variant system, no rules configuration object. The 2024
official ruleset only. A second ruleset is what justifies the abstraction, and it does not exist.

**Auth is untouched.** The template's Password provider stays as-is. This slice creates no Users
and gates nothing behind sign-in.

## Testing Decisions

**A good test here asserts rulebook outcomes, not internals.** It feeds a state and a sequence of
events into the reducer and asserts the resulting scores, whose Turn it is, and whether the Game
ended. It never reaches into how the reducer represents dice, and it never asserts that a helper
was called. If a test breaks when the internal shape changes but the rules did not, it is testing
the wrong thing.

**One seam: the pure reducer.** Confirmed with the developer. Because dice arrive as event payload,
every test is deterministic with no seeding, no mocking, and no injection.

**Vitest, and nothing else.** One dev dependency. No convex-test, no test database, no fixtures,
no component tests in this slice.

**What must be covered**, at minimum: the scoring table for singles and every triplet; a triplet
split across two Rolls scoring nothing; each die counting once; Niete detection and Turn forfeit;
Tutto detection and the six dice returning; a Tutto chain across several Cards; each of the seven
Card types in both its success and failure branch; Straight's replacement of the validity rule;
Plus/Minus against a single leader, against tied leaders, and drawn by the leader; the zero floor;
Cloverleaf ending the Game mid-round; 6000 triggering the Final round rather than ending the Game;
and a Final round where the Seat that crossed 6000 first does not win.

**Prior art: none.** This is the first test in the repo. It sets the pattern, so it is worth doing
carefully — the shape chosen here is the shape every later test will copy.

## Out of Scope

- Multiplayer of any kind — Seats beyond the first in the UI, Invite links, Spectators, turn ownership, authorization.
- Accounts, sign-in changes, magic link, and claiming a guest Seat.
- The stats screen and the stat list. This slice only ensures the data to compute them is recorded.
- Any variant or house ruleset, and any rules configuration.
- Deployment, Convex hosting, custom domains, and the web app manifest.
- Card artwork and visual design beyond what is needed to read the game.
- Sound.
- A second test seam at the Convex function surface. It arrives with multiplayer, when there is authorization to protect.

## Further Notes

The rules in this spec were taken from the official 2024 ABACUSSPIELE rulebook, in both the English
and German editions, not from memory or from the many Farkle-family variants that resemble Tutto
but score differently.

Two rules are easy to get wrong because most similar games do the opposite, and both are worth a
test that fails loudly:

- **Reaching 6000 does not win.** It opens the Final round. The Seat that crosses first can lose.
- **A triplet must arrive in one Roll.** It cannot be assembled from dice set aside across Rolls.

The rulebook is silent on what happens when the deck runs out — the reshuffle is a decision, not a
rule, and it is recorded here rather than in the rulebook because there was nothing to copy.

`Tutto` names both the app and the in-game event, in German as well as English. `CONTEXT.md` holds
the convention: the event keeps the name, the product is "the app". _Volle Lotte_ is a different
game and must not appear anywhere.
