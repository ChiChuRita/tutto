# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people who already own the ABACUSSPIELE box and know how Tutto is played.
The app is a remote table, not a teacher. It may assume the rules are known, and it may
lean on the printed deck's colours as recognition rather than explanation.

They play from a phone, several at once, over a link one of them sends the others.
Games are persistent and untimed, so the real situation is repeated short visits across
days rather than one sitting: open the link, see whose Zug it is, play or watch, close it.

Two positions are first-class, not a fallback:

- **Player** — holds a Seat, account or guest with just a name.
- **Spectator** — arrived after play began, or their Zug has passed. Tutto has no hidden
  information beyond the undrawn deck, so a Spectator sees exactly what a Player sees.

## Product Purpose

Let a group that knows Tutto keep playing it when they are not in the same room, without
losing what the physical game is like: you recognise the card that landed, you watch the
dice, and the turn is a thing that happens in front of everybody.

Success today is that the owner's own circle uses it and games finish. Going public is a
later goal the user has named but not committed to; nothing should be designed around
growth, discovery, or acquisition until it is.

## Positioning

The mechanism a neighbouring dice-game app could not truthfully copy:

- **The server chose it, the client replays it.** Every die and every card is decided by
  the backend; the client only shows the result it already has (ADR 0001). The rules run as
  a pure reducer with zero imports (`src/game/turn.ts`), so the same function is the
  authority on the server and plain data in tests.
- **The screen deliberately lags the truth.** A _settled position_ (`src/settled.ts`) holds
  a Roll's outcome back until the movement showing it has finished, so the app cannot spoil
  its own news — you never read "Niete" a second before the dice land on it.
- **The link is the game, not a seat.** Anyone holding the Invite link may take a Seat;
  taking one is a deliberate act on arrival (ADR 0004). No room codes, no lobby accounts,
  no invitations to accept.
- **Seats outlive users.** A Seat exists whether or not a User owns it, and a guest's Seat
  can be claimed later (ADR 0002). Stats are recorded against Seats.

## Operating Context

- **Ritual:** one player starts a Game and sends the URL. Others open it and take a Platz,
  signed in or as a guest with a name. Play proceeds one Zug at a time across days.
- **Environment:** phones, mostly, held one-handed. The play screen must fit the viewport
  whatever the browser leaves of it.
- **Device memory:** the Games this device has opened and the Seat secrets it holds live in
  `localStorage`. Losing a secret is losing the Seat, so it is written before anything else.
- **Endgame:** first past 6000 does not win. Remaining Players equalise Zug counts in the
  letzte Runde, and the highest score at the end takes it. A Plus/Minus that takes the last
  Player off 6000 calls the letzte Runde off: the Game runs on until somebody holds the number
  again.
- **Reference material:** the 2024 edition rulebook. Its wording and its card colours are
  the source of truth for the interface, not a fresh translation.

## Capabilities and Constraints

Confirmed and shipped: create a Game, share the Invite link, take a Seat as User or guest,
draw a Card, Roll, herauslegen, aufhören, TUTTO and Niete resolution, the 56-card deck as
remaining counts (ADR 0003), a played pile that keeps exactly two faces and no history
(ADR 0007), spectating, presence, per-User Stats with head-to-head records, and abandoning
a Game (final scores, no winner, excluded from win/loss).

Hard constraints:

- **Mobile-first, and the play screen never scrolls.** The table fits inside the viewport at
  390x844 and below. Only the Games list and the record may grow and scroll.
- **Turns are never skipped and no Seat can be removed** (ADR 0005).
- **No hidden information** beyond the undrawn deck. Anything a Player sees, a Spectator sees.
- **One theme.** Nothing in the app is conditional on a colour scheme.
- **German interface, English code.** The `CONTEXT.md` wording table is law: Niete, Drilling,
  herauslegen, Zug, Wurf, aufhören, Straße, Kleeblatt, Feuerwerk, Stop-Karte, letzte Runde,
  Platz, Spiel. »TUTTO« in caps is the in-game event; the product is called "the app".
  _Volle Lotte_ is a different game and never appears here.
- **Unofficial implementation.** Tutto is ABACUSSPIELE's game. The app is not affiliated
  with or endorsed by them, and the repo's own statement is that no artwork is traced from
  or imitates the published deck: every mark is drawn in this repository. Recorded from the
  README and licence as a standing fact, not raised as a preference in the interview.

Terminology beyond the table above lives in `CONTEXT.md`; the decisions that were expensive
to reach live in `docs/adr/`. Both are authority.

**Open decision:** the visual layer is being revised. The user's position is that the current
UI needs a complete revision. The incumbent world ("Papier", documented at length in
`src/index.css`) is therefore evidence and anti-reference for that work, not a thing to
polish. Product truth in this file survives it; the look does not.

## Brand Commitments

Binding through any UI revision, confirmed by the user:

- **German UI in the rulebook's own words.** As above. Not retranslated.
- **The printed deck's card colours stay tied to the same cards** — blue, red, green, straw.
  That mapping is how someone who owns the box knows what has landed. _How_ the colours are
  used is open; _which card is which colour_ is not.
- **Mobile-first, play screen never scrolls.** Listed as a constraint above because it is
  one, and named here because the user made it binding rather than incidental.

The name is "Tutto". The voice in the interface is plain and quiet: the app labels things
and does not narrate them.

## Evidence on Hand

Real, in the repository:

- `CONTEXT.md` — the domain vocabulary, including the German wording table and the words to
  avoid for each term.
- `docs/adr/0001`–`0007` — the seven recorded decisions.
- `README.md` — the game in a paragraph, how it is built, the artwork statement.
- Card marks drawn in this repo (`src/Mark.tsx`, `src/Card.tsx`).
- A test suite over the reducer and the pure modules around it (`npm test`).

Absent, and not to be fabricated: there are no users besides the owner's circle, no
testimonials, no press, no benchmarks, no pricing, no analytics, and no public deployment.
The app has no landing page and no marketing surface. Do not write copy that implies any
of these exist.

## Product Principles

1. **The box is the reference.** A player who owns the game should recognise what happened
   without reading. Rulebook words, rulebook card colours, no invented vocabulary.
2. **The server decides; the screen replays.** Never let the interface be the authority on
   an outcome, and never show an outcome before the movement that reveals it has finished.
3. **The table fits the phone.** Air is the first thing to give. The play screen is a fixed
   budget, and nothing earns a scroll on it.
4. **A spectator is a real position.** Every state has to read for someone who cannot act,
   because half the people looking at a Game at any moment cannot.
5. **Persistent and untimed.** Design for someone returning after a day, not for a session.
   Whose Zug it is must be answerable in a glance.

## Accessibility & Inclusion

**WCAG 2.2 AA, binding.** The user made this the standard for the revision, which is a step
up from what is shipped. It covers, and is not limited to:

- contrast solved per job — 4.5:1 for small text, 3:1 for graphic objects and UI components;
- a visible focus indicator on every interactive element;
- play that is completable by keyboard alone, including herauslegen and the Card draw;
- an accessible name and role for every control, including the dice and the Cards;
- `prefers-reduced-motion` honoured, which the shipped app already does at each call site;
- German as the document language (`lang="de"`), so a screen reader pronounces the interface.

The play screen animates outcomes, so a state that is only communicated by movement is a
defect: it must also be readable as text.
