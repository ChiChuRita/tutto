# 01 — The dice set aside lie on the table

**What to build:** A die that has been set aside reads as an object lying on the table, the same way a
die in the hand does.

**Blocked by:** None — can start immediately

**Status:** done

## The complaint

»the colors look odd espeically the dices which are herausgelegt«

## It is not a colour choice, it is a missing ground

`bg-felt` appears once in the app — the hand grid. The »Herausgelegt« row has no background, so:

| | die | ground | contrast |
| --- | --- | --- | --- |
| in hand | `#ffffff` | felt `#d5def0` | 1.35:1 |
| set aside | `#ffffff` | page `#eceff9` | **1.15:1** |

1.15:1 is the number `--color-felt`'s own comment calls »a hole rather than an object«. The felt token
exists because of that measurement; it was never applied to the second row of dice.

The comment above the row also says the set-aside dice are »smaller, darker, and never rerolled«.
There is no darkening anywhere — the only `brightness()` in the file is the played pile's second card.
Per `f18d460`, an argument that is false is a defect and not a typo.

## The dim could not be had, and that is the finding

The obvious repair was to make the false promise true — dim the set-aside dice, using the played pile's
`brightness()` at a lighter value. It does not survive its own floor. Dimmed to 0.94 a die reads
**1.19:1** against the felt: under the 1.3 this row was fixed to clear, and barely above the 1.15 hole
it was fixed *from*. The largest dim that still clears the floor is **1.8%**, which nobody sees.

Dimming the row instead of the dice was worse in a second way: the row is the felt, so the felt would
render `#c8d1e1` here against `#d5def0` under the hand, and two felts a shade apart read as a mistake
rather than as a distinction.

The dim and the ground want the same contrast and only one can have it. The ground wins — it is the one
a Player needs. Out-of-play is already said by the label above the row and by the size. So the comment
stops promising »darker« rather than the code starting to do it.

- [x] A set-aside die clears 1.3:1 against what it lies on — 1.35:1, the same as a die in the hand
- [x] The felt under this row is the same felt as under the hand, not a shade off it
- [x] The row's height is unchanged, so the fold budget is untouched
- [x] The comment describes what the code does, and says why there is no dim
