# 02 — The play screen holds still and hints nothing

**What to build:** Three fixes to the play screen. Nothing is clipped, nothing moves under the
Player's thumb, and the dice stop telling the Player which of them score.

Grouped into one ticket because each is small, all three live in the same screen's markup, and
none of them touches the Card. Splitting them would produce three tickets that could not run in
parallel anyway.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## 1. Nothing is clipped

A die appears cut off as it tumbles, as though something clips it when the cube sweeps outside its
box.

**Diagnose it before changing anything.** Find what actually clips — an `overflow` up the tree, a
box sized exactly to the die while the rotating cube extends past it, a stacking or `perspective`
boundary — and name the cause in the commit message or a comment. Adding room until it stops
looking wrong is not a fix; this is the kind of defect that gets papered over and returns.

## 2. The layout holds still

The action buttons render differently per phase and the messages (TUTTO!, Niete!, the Stop-Karte
line, the failure line) appear and vanish, so the page jumps between taps — sometimes putting a
different button where the Player is already aiming.

Reserve the space. The action buttons and the message line hold their height whether or not they
have content. What changes between phases is what sits in the slot, not the geometry of the page.

## 3. The dice stop hinting

Dice that score currently render near-white; dice that do not render grey and are `disabled`. Both
go. Reading a Roll — spotting the triplet, noticing the lone 5 — is most of the skill in Tutto, and
the interface hands the answer over before the Player has looked.

Every die in a Roll looks identical, and every die can be selected. »herauslegen« refuses a
selection that does not score, which it already does — the score preview comes from the same pure
function the server validates with.

Removing only the colour while leaving the dice disabled would not remove the hint. A die that is
dead to the touch says exactly the same thing more quietly.

Dice already set aside keep their distinct out-of-play treatment. That is not a hint about what
scores; it is a record of what has already happened.

Nothing about correctness changes. The reducer decides what a selection is worth, the server
validates it, and neither is yours to touch.

- [ ] The cause of the clipping is identified and named, not worked around
- [ ] A die mid-tumble is not clipped
- [ ] The action buttons hold their space across every phase of a Turn
- [ ] The message line holds its space whether or not there is a message
- [ ] Nothing on the play screen shifts position between taps
- [ ] Every die in a Roll looks identical regardless of whether it scores
- [ ] Every die in a Roll can be selected
- [ ] »herauslegen« refuses a selection that scores nothing
- [ ] Set-aside dice keep their distinct treatment
- [ ] `src/game/turn.ts` and everything under `convex/` are untouched
