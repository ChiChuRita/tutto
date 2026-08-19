# 03 — The deck is the button

**What to build:** You draw a Card by tapping the deck.

Today drawing is a full-width button below the table, in two places: at the start of a Turn, and for the Seat up next on a Turn that is over. The deck itself sits at the top of the screen and does nothing. That is backwards — the deck is the object the Card comes from, it is already drawn on the table, and reaching for it is the move.

After this ticket both buttons are gone and the deck is the control.

**Blocked by:** None — can start immediately

**Status:** done

Three things this has to decide rather than skip:

**The Tutto decision.** After a TUTTO the button reads »weitermachen«, and that is not a draw — it is the Player choosing to roll on instead of banking. Tapping the deck now carries that choice, which means the deck and »aufhören« become the two halves of one decision, and the screen has to make that legible. A Player at that moment must be able to tell that tapping the deck risks everything they have. This is the one place the change touches a game rule rather than a control, and it is the part to get right.

**The empty slot.** The move slots hold their height in every phase and for every Seat, deliberately, so a thumb already on its way down lands on what it was aiming at. Removing the primary button leaves that slot empty in the drawing phases. Decide what stands there — and if the answer is nothing, the slot still holds its height.

**It has to be a real control.** Not a click handler on a decorative element. It needs an accessible name saying what tapping it does, keyboard and assistive access, a visible focus ring, and a disabled state when it is not this device's move — the same treatment every other move on this screen already gets. A Player who cannot tap must still be able to draw.

The deck is also the thing that shows how many Cards are left, and the Card flies from it to the played pile when drawn. Neither should be lost.

- [x] Tapping the deck draws a Card, at the start of a Turn and for the Seat up next on a finished Turn
- [x] Both »Karte ziehen« buttons are gone
- [x] After a TUTTO, tapping the deck rolls on, and the screen makes clear that this is the risky half of a choice whose other half is »aufhören«
- [x] The deck is reachable and operable by keyboard, has an accessible name describing the action, and shows focus
- [x] The deck is visibly and actually inert when it is not this device's move, and for a Spectator
- [x] The move slots keep their height in every phase, and no move moves position between taps
- [x] The deck still shows how many Cards are left, and the Card still flies from it to the played pile
- [x] The play screen still does not scroll at 390x844, 375x667, 375x553 and 320x844, in both the solo case and four Seats with the Final-round banner

## Comments

Built on `lane/03-the-deck`, merged into `epic/the-throw`.

`deck.ts` decides in one place whether the deck is a move and what to call it;
the German lives in the tested module as `message.ts`'s does. Twelve tests, all
playing positions through the reducer rather than hand-building them, and
mutation-checked.

**A Tutto is always a genuine choice.** A "forced" branch was written first, then
found unreachable: the three forcing Cards never land on `awaitingCard` with
`tutto` set — Feuerwerk and Kleeblatt stay in force and go to `awaitingRoll`,
Plus/Minus goes to `stopped`. The branch is deleted, and a test plays every Card
through to its Tutto to assert stopping is really offered, so the prompt cannot
promise a choice the game will not give.

The deck's name and the slot line both state the score the tap risks, in the
alarm colour, directly above »aufhören«. The slot is not filler — it names the
deck for a Player who has not learned it is tappable, and it is where the wager
is said out loud.

Fold, measured by real scrolling rather than arithmetic: **zero scroll** at all
four viewports, solo and four Seats with the Final-round banner, including the
two-line Tutto line. Tightest is 320x844 with 22px spare.

Worth carrying forward: `documentElement.scrollHeight - clientHeight` reports
19px at 320x844 **on `main` too**, before any of this work. It is phantom —
nothing sits past the fold and scrolling does nothing — and it is very likely
the number earlier "no scroll" checks were reading.
