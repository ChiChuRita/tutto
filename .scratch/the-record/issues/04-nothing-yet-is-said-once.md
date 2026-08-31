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

Landed with the Tippschein ground, which is the only base it could land on: the vocabulary it is
written in (`field`, `field-machine`, `legend`, `receipt`, `reversed`) is that ground's. Ticket 05
went ahead of it in `34a6e46`, being a backend correctness fix that touches no ground.

## Comments, after the ground was reverted

Reverted with the ground. Papier's empty record says »Noch keine beendeten Spiele« under a best-Zug
tile showing an em-rule, which is the duplication this ticket removed. Left open: the argument holds
on any ground, it is just written in Tippschein's vocabulary and would need redoing in Papier's.
