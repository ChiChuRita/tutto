# 04 — Nothing yet is said once

**What to build:** With nothing finished, the record shows the heading and one sentence. No field,
no dash.

**Blocked by:** None

**Status:** done

Today a signed-in Player with no finished Games sees a `field-machine` well containing the die
mark, the legend `Bester Zug`, and an em-rule where the number goes, and then a sentence
underneath saying there are no finished Games yet (`evidence/before-empty.png`). It is an empty
form field followed by a separate explanation of why it is empty.

The two are the same fact. `bestTurn` is `null` exactly when `opponents` is empty, because
`statsFor` derives both from the Games that pass `countsForStats`. So when `bestTurn === null`,
render the sentence and not the field.

The existing sentence is right and stays as it is: "Noch keine beendeten Spiele. Spiel eines zu
Ende, dann steht deine Bilanz hier." It sits under the `Bilanz` heading from 01, the way
`OpenGames` puts its own empty sentence under `Offene Spiele`.

A guest is unaffected: `api.stats.mine` returns `null` for them and the component renders nothing
at all, because the case for an account is made in `Account.tsx` next to the control that offers
one.

- [x] With no finished Games, the record is the heading plus one sentence
- [x] The `Bester Zug` field does not render when `bestTurn` is `null`
- [x] No em-rule placeholder appears anywhere in the record
- [x] A guest still sees no record block at all

## Comments

Not on `main`. This is written in the Tippschein vocabulary (`field`, `field-machine`, `legend`,
`receipt`, `reversed`), none of which exists on this base: the ground was in flight in a working
tree eight commits behind `origin/main` and never landed. The work is real and it is on the
`tippschein-wip` branch. Only ticket 05, which is a backend correctness fix and touches no ground,
came across to `main`.
