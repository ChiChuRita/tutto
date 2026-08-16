# Spec: The play screen — real Cards, motion, and a table that holds still

Status: ready-for-agent

## Problem Statement

The rules are right and the app is playable, but it does not feel like a game. It reads like a
form that happens to be about dice.

A Card — the thing that decides what a whole stretch of a Turn is worth — is a coloured strip of
text. The deck it came from is a number in a box. Drawing a Card, which is the moment a Turn's
character is decided, happens instantly and invisibly: the strip's text simply changes.

The screen also moves under the Player's thumb. Different buttons render in different phases and
messages appear and vanish, so the page jumps between taps — occasionally putting a different
button where the Player is already aiming.

And the app plays part of the game for the Player. Dice that score are drawn light, dice that do
not are drawn grey and are not even tappable. Reading a Roll — spotting the triplet, noticing the
lone 5 — is most of the skill in Tutto, and the interface hands the answer over before the Player
has looked.

One straightforward bug sits on top: a die appears cut off as it tumbles, as though something is
clipping it.

## Solution

A Card looks like a card. Portrait, framed, with its value large in the middle and repeated small
in the corners the way a playing card carries its indices, and a motif that says at a glance which
of the three families it belongs to. The deck is a pile of the same cards face-down.

Drawing one is an event you watch: the card lifts off the pile — the real pile, wherever it is on
screen — travels to its place, and turns over.

The rest of the table holds still. Buttons and messages keep their space whether or not they have
anything to say, so nothing moves between taps.

The dice say nothing. Every die in a Roll looks the same and every one can be picked up. If the
Player picks a selection that does not score, the move refuses — but working out which dice score
is theirs to do, which is the game.

## User Stories

### The Card

1. As a Player, I want a Card to look like a card, so that the thing driving my Turn reads as an
   object rather than a label.
2. As a Player, I want the Card in the same portrait shape as the pile, so that the one I am
   holding is obviously from that deck.
3. As a Player, I want the Card's value large and centred, so that I can read it at a glance
   mid-Turn.
4. As a Player, I want the value repeated small in the corners, so that the card reads as a card
   even when partly covered or mid-flight.
5. As a Player, I want each family — Bonus, multiplier, forcing — to be recognisable by colour and
   motif, so that I know what kind of Card I have before I read the words.
6. As a Player, I want a design that is the app's own, so that the app is not passing off the
   published game's artwork.
7. As a Player, I want the effect sentence below the card in plain German, so that a rule I do not
   remember is still legible.
8. As a Player, I want the Card and the six dice on screen together, so that I can weigh the Card
   against the Roll without scrolling.
9. As a developer, I want a Card added to the rules to be a compile error until it has a face, so
   that a new Card can never render unstyled.

### The draw

10. As a Player, I want the Card to come off the pile, so that drawing feels like taking the top
    card rather than a value appearing.
11. As a Player, I want the Card to turn over as it arrives, so that the moment it is revealed is a
    moment.
12. As a Player, I want the draw to start from wherever the pile actually is, so that it is right
    when the »letzte Runde« banner has pushed everything down.
13. As a Player, I want the Card in flight never to be cut off, so that the animation does not look
    broken.
14. As a Player after a TUTTO, I want the spent Card to give way to the new one, so that a fresh
    Card is visibly fresh.
15. As a Player who has turned off animation in my system settings, I want the Card to simply be
    there, so that the app respects a setting I set for a reason.

### The table

16. As a Player, I want the buttons to stay where they are between phases, so that I do not tap the
    wrong one because the page moved.
17. As a Player, I want messages like »TUTTO!« or »Niete!« to appear without shoving the rest of the
    screen, so that my aim survives the news.
18. As a Player, I want the failure message to occupy space that was already reserved, so that a
    refused move does not rearrange the table.
19. As a Player, I want dice to be able to tumble beyond their box without being clipped, so that
    the roll looks like a roll.
20. As a Player, I want movement generally — things arriving, leaving, and changing place — to be
    animated, so that the app feels alive rather than redrawn.

### The dice

21. As a Player, I want every die in a Roll to look the same, so that spotting what scores is my
    job.
22. As a Player, I want to be able to pick up any die, so that I can try a selection and be told it
    does not score rather than being prevented from considering it.
23. As a Player, I want »herauslegen« to refuse a selection that scores nothing, so that I cannot
    make an illegal move by accident.
24. As a Player, I want dice I have already set aside to stay visually distinct, so that I can see
    what is out of play.
25. As a Player, I want the running score of my current selection, so that I can confirm a choice I
    have already made — not be told what to choose.

## Implementation Decisions

### The Card becomes portrait, superseding the earlier landscape decision

A Card is roughly 2:3 and 6rem tall. The shape is what makes a card read as a card; the size is what
threatened the dice grid, and the two are separable. At this size both the Card and the six dice fit
above the fold on a phone.

The 7rem this section first named did not survive the measurement: at 7rem the Card, its effect
sentence and all six dice did not clear the fold at 390×844 with four Seats and the »letzte Runde«
banner up. 6rem is what shipped, and it is stated in one place — `--card-height` in `index.css`.

This reverses the first design round, which chose a landscape strip precisely to protect the dice.
That decision was made without a portrait card on screen to look at. No ADR was written for it,
deliberately, because it was cheap to reverse — which it has now proved to be.

### The face carries the Card's meaning, superseding the name set large

The middle of the Card says what the Card _does_: +1000 over −1000, a stop sign, a burst, the six
dice faces 1 through 6, a clover. The German name is still on the face, in small type under the
mark. Around it is a frame with an inset border, corner indices, and one flat original motif per
family. Nothing is traced from or imitates the published game's artwork.

This reverses the first round's rule that the face is the name set large rather than an icon set,
which was chosen because eleven bespoke illustrations is eleven things to get right. What settled it
was that »FEUERWERK« and »KLEEBLATT« only fit a 6rem card broken across two lines at 14.6px —
smaller than the effect sentence below the card. A symbol has no length to fit, so the reversal
deleted the mark-sizing and line-breaking machinery rather than extending it. Ticket 06 has the
detail.

Eleven Cards still do not get eleven illustrations: the Bonus Cards and ×2 keep their numeral,
because there the number is the meaning.

The three families are unchanged: Bonus green, multiplier blue, forcing red. The **forcing Card**
grouping is the glossary's five, not the reducer's three — the two lists differ for reasons already
recorded in `CONTEXT.md`, and neither is wrong.

### The draw is measured, not guessed

The first implementation animated from a fixed offset, which is why it does not read as coming off
the pile and why it is visibly wrong when the Final-round banner shifts the layout. The pile's and
the slot's real positions are measured at draw time and the animation runs between them.

This is the one piece of genuinely new logic in the feature, and the only part with a testable
seam of its own.

### The motion library is adopted, superseding the earlier CSS-only decision

`motion` becomes a runtime dependency and is used for the draw, for elements entering and leaving,
and for layout changes. This reverses the first round's CSS-only approach. The justification is
that a measured flight, exit animations and layout animation are each things that would otherwise
be hand-rolled, and the repo would end up with a worse version of what the library does.

The die's tumble stays in CSS. It is a `preserve-3d` cube rotating into a resting face, it works,
and it stays on the compositor; the library would add main-thread work and buy nothing. Dice
entering and leaving are fair game.

### Animation remains a replay, not a simulation

Nothing here changes ADR 0001. The server chose the Card and the faces; the animation shows a
result that already exists. Nothing may reach for the deck's contents — ADR 0003 stores the deck as
counts precisely so a stored order cannot leak where the Cloverleaf is, and that includes the
presentation layer.

### Reduced motion is a hard requirement, through one mechanism

Every animation added is disabled under `prefers-reduced-motion: reduce`, using the library's own
hook rather than a second mechanism sitting beside the existing CSS media query.

### Space is reserved rather than reflowed

The action buttons and the message line hold their height whether or not they have content. What
changes between phases is what is in the slot, not the geometry of the page.

### The dice stop advertising which of them score

The valid/invalid distinction goes: identical appearance, and every die selectable. Removing only
the colour while leaving invalid dice disabled would not remove the hint — a die that is dead to
the touch says exactly the same thing more quietly.

Correctness is unaffected. The reducer already decides what a selection is worth, the server
already validates it, and the score preview on the button comes from the same pure function. What
changes is only what the interface volunteers before the Player has chosen.

Set-aside dice keep their distinct out-of-play treatment. That is not a hint about what scores; it
is a record of what has already happened.

### The clipping is diagnosed before it is fixed

The cause is to be identified — an `overflow` up the tree, a box sized exactly to the die while the
rotating cube sweeps past it, a stacking or `perspective` boundary — and named in the commit or a
comment. Adding room until it stops looking wrong is not a fix, and this is the kind of defect that
gets papered over and returns.

## Testing Decisions

A good test here asserts behaviour a Player could describe, never a shape or a class name. The
prior art is `src/dice.test.ts` and `src/cards.test.ts`: both test pure functions that presentation
consumes, and neither renders anything. The suite has no mocking, no `convex-test` and no seeded
RNG, and that property survives this feature.

The honest position is that most of this spec cannot be tested, and the spec would rather say so
than build structure that implies coverage it does not have.

**Seam 1 — the existing Card face mapping.** `cardFace` maps every Card to its family and mark and
is extended with whatever per-family data the design needs. Its existing test — all eleven Cards map
to a family and a non-empty mark, the forcing family is exactly the glossary's five — is what makes
a Card added later impossible to leave unstyled.

**Seam 2 — the draw geometry, new and pure.** Given the pile's rectangle and the slot's rectangle,
return the offset and scale the flight starts from. Mirrors the shape of `dice.ts`'s
`startRotation`. Worth testing because it has real cases: the pile above the slot and beside it, the
banner shifting the slot down, and a rectangle that has not been measured yet.

**Confirmed by a human, not by the suite.** Stated per criterion so nobody assumes otherwise: that
the frame and motifs read as a card; that the pile and the drawn Card read as one deck; that the
flight looks like it comes off the pile; that nothing is clipped; that the layout does not shift;
that reduced motion actually stops the movement; and that light mode is right, which has never been
checked at all — every screenshot taken of this app so far has been in dark mode.

## Out of Scope

- Any change to the rules, the reducer, the deck, or the Convex functions. This is presentation.
- Card artwork imitating or derived from the published ABACUSSPIELE cards.
- Illustrations per Card. Five Cards whose meaning is not a number get one flat drawn mark each, and
  the families keep their motifs — but nobody is drawing eleven pictures.
- Sound.
- A design pass over the other screens — the lobby, the Games list, sign-in, the stats table. Those
  are being built by implementation agents in passing and deserve their own look once the
  multiplayer tickets have landed and there is a whole app to judge at once.
- Theming, a colour system, or design tokens beyond what these screens need.
- Replaying a finished Turn as an animation.

## Further Notes

This work is sequenced after multiplayer tickets 04 and 05. Both rewrite the same parts of the play
screen — the button column and the dice grid — and running this alongside them would create a merge
to resolve by hand for no gain.

Two decisions from the first design round are reversed here: the landscape card shape, and the
CSS-only approach to animation. Both were recorded as ticket text rather than ADRs, on the judgement
that they were cheap to reverse. That judgement held, and it is the reason this spec costs a
rewrite of two components rather than an architectural argument.

`CONTEXT.md` gained **Forcing Card** for this work, including the note that the five reach that
outcome three different ways so no single list in the code names them all.
