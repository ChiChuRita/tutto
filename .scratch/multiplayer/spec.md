# Spec: Multiplayer Tutto — open Games, guests, accounts and head-to-head stats

Status: ready-for-agent

## Problem Statement

The rules engine is finished and one person can play a full Game on their phone, but they can
only play against themselves. Tutto is a party game. The whole point is watching someone push
their luck one Roll too far, and there is currently nobody to watch.

Getting friends into a Game is where party games die. Every extra step before the first die
lands — install this, make an account, type this six-letter code — loses someone. And once a
Game is over there is nothing to come back for: no record that you beat Anna, no reason to open
the app tomorrow.

There is also a real hole in what exists. Finished Games are queried with no owner, so the list
of past Games returns every Game in the deployment. With one Player that is invisible. The day a
second person plays, it is a leak.

## Solution

A Game is **open**: it has a URL, and anyone holding that URL can take a Seat in it. Nothing
else. You tap »Neues Spiel«, send the link to the group chat, and people arrive. A User takes
their Seat under their profile; anyone else types a name and takes one as a guest. No account is
needed to create a Game, take a Seat, or play a full Game to the end.

When everyone is in, the creator taps »Los geht's« and the Game begins in join order. Every
phone watches the same live position; only the Seat whose Turn it is sees the buttons. Anyone
who arrives after the start still sees the whole Game — Tutto has no hidden information — but
gets no Seat.

For the people who want a record, an account turns the Games you have already played into a
head-to-head history: how many Games you have shared with each opponent, how many you won, how
many you lost, and the best Turn you have ever had.

## User Stories

### Creating and joining

1. As a Player, I want to create a Game without signing up, so that nothing stands between me
   and sending the link.
2. As a Player, I want a Game to have a plain URL I can paste into a group chat, so that inviting
   people needs no code, no QR, and no app.
3. As a Player opening an Invite link, I want to see who is already in the Game, so that I know
   I am in the right place before I commit.
4. As a guest, I want to take a Seat by typing a name, so that I can play without an account.
5. As a guest, I want the name I used last time offered to me, so that joining a second Game is
   one tap.
6. As a guest, I want to be told when the name I typed is already taken in this Game, so that
   two people are not both called Anna at the same table.
7. As a User, I want to take a Seat under my profile name without typing anything, so that
   signing up is worth something at the moment I join.
8. As a Player, I want my Seat to survive a page refresh, so that a mistap does not cost me my
   place.
9. As a Player, I want to see that I am already seated when I reopen the link, so that I do not
   take a second Seat by accident.
10. As the creator, I want to start the Game when everyone has arrived, so that turn order is
    fixed and play can begin.
11. As the creator, I want to start a Game with only myself in it, so that I can still play
    solo the way I do today.
12. As a Player, I want turn order to be the order people joined, so that nobody has to arrange
    anything.
13. As someone who opens the link after play began, I want to watch the Game, so that I can
    follow along even though I missed the start.
14. As a Spectator, I want to see everything the Players see, so that following the Game does
    not require guessing — Tutto has no hidden information beyond the undrawn deck.

### Playing together

15. As a Player, I want to see whose Turn it is by name, so that I know whether the Game is
    waiting on me.
16. As the active Player, I want the action buttons only on my Turn, so that I cannot act out
    of order.
17. As a waiting Player, I want to watch the active Player's Rolls as they happen, so that the
    tension of a push-your-luck Turn is shared.
18. As a waiting Player, I want the dice and Cards to animate on my screen too, so that a Turn
    plays out rather than jumping between positions.
19. As a Player, I want every Seat's score visible throughout, so that I can judge whether to
    push on or stop.
20. As a Player, I want to see the Final round announced to everyone, so that we all know the
    Game is ending and why reaching 6000 did not win it.
21. As a Player, I want to close the tab mid-Game and come back later, so that a Game can span
    days without anyone having to sit still.
22. As a Player, I want to find my way back into a Game I am seated in without the original
    link, so that losing the message does not lose the Game.
23. As a Player, I want to see the Games I am currently in, so that I can pick up whichever one
    is waiting on me.
24. As a Player in a Game that has stalled, I want to abandon it, so that a friend who stopped
    replying does not leave it open forever.
25. As a Player, I want an abandoned Game to keep its scores but name no winner, so that nobody
    is credited with a win nobody earned.

### Accounts and stats

26. As a Player, I want to sign up with an email, a password and a display name, so that my
    results start being recorded.
27. As a Player who has been playing as a guest, I want signing up to claim the Games I already
    played on this phone, so that my history is not thrown away.
28. As a Player, I want to be told plainly that claiming only covers Games played on this
    device, so that I am not surprised by a missing Game later.
29. As a User, I want to see my record against each opponent I have played, so that there is
    something to argue about.
30. As a User, I want to see how many Games I have shared with each opponent alongside the wins
    and losses, so that a 2–0 and a 2–14 do not read the same.
31. As a User, I want my best single Turn shown, so that the one time I chained four TUTTOs is
    on the record permanently.
32. As a User, I want abandoned Games left out of my record, so that walking away from a stalled
    Game does not count as a loss.
33. As a User, I want only Games I have finished with other Users to appear in head-to-head, so
    that the numbers mean what they say.
34. As a User, I want to sign in on a second device and see my record, so that the account is
    worth having.
35. As a User, I want to sign out, so that I can hand my phone to someone else.
36. As a Player, I want the list of past Games to show only mine, so that I am not looking at
    strangers' Games.

## Implementation Decisions

### The lobby lives in the reducer

`GameState` gains a `"lobby"` phase preceding `"playing"`. Taking a Seat and starting the Game
become reducer events alongside the existing draw / roll / setAside / stop / nextTurn. This keeps
every rule that can be stated as a rule — who may take a Seat, when a name is a duplicate, that a
Game cannot start with zero Seats, that turn order is join order, that a Seat cannot be taken
after the start — inside the one module that is already exhaustively tested, and leaves the
Convex mutations as the thin transactional wrappers they are today.

### A Seat gains an identity, and the reducer stays import-free

A Seat becomes name plus a nullable owner alongside its score and turn count. The owner is an
opaque string as far as the reducer is concerned — Convex's `Id` type never enters `turn.ts`,
which has zero imports and keeps them. The nullable owner is ADR 0002, unchanged: a guest's Seat
has no owner and may be claimed later.

### The Invite link identifies the Game, not the Seat

The link is the Game's URL. It grants no Seat by itself; taking one is a deliberate act on
arrival. This is a change from the previous glossary wording and is significant enough to record
as an ADR. The alternative — a per-Seat secret baked into a per-Seat link — was rejected because
it cannot tell an account from a guest, and because the device needs its own proof after joining
regardless.

### The device proves its Seat with a secret minted at join

Taking a Seat returns a secret that the browser stores. Every mutation that acts on a Seat
carries it, and the mutation rejects a secret that does not match. This is what makes a Seat
survive a refresh and what stops one phone playing another's Turn. It is a bearer credential:
whoever holds it is that Seat. That is an accepted cost for a friends' dice game.

The browser holds a secret per Seat it has taken, across several Games. The single stored
game id in use today is replaced by this collection, which is also what makes "the Games I am in"
and "my past Games" answerable on the client.

### Authorisation is a thin check over a pure predicate

Whether a move is legal for a given Seat is a reducer question and belongs with the rules.
Whether the caller *is* that Seat is a secret comparison and belongs in the mutation. Keeping the
split at that line means the interesting half is tested at the existing seam and the untested
half is a string equality.

### No Turn skipping, no Seat removal

A silent Player cannot be skipped and cannot be removed. The Final round is defined on equal
Turn counts, so a skipped Turn breaks the 6000 rule. Abandoning the Game — which already exists,
already keeps scores, already names no winner and is already excluded from stats — is the only
escape. Recorded as an ADR, because a timeout is an easy thing to add later in good faith.

### Spectators are the default, not a feature

Anyone can read a Game. Seats are what is restricted. A Spectator is therefore not a stored role
but the absence of a Seat secret for that Game, which means no new schema and no join step for
watching.

### Authentication stays with the Password provider

Convex Auth is already installed and configured with email and password. Sign-up additionally
captures a display name, since head-to-head needs something to print and the provider supplies
only an email. Magic links and OAuth were both rejected: each adds infrastructure (email
delivery, or developer consoles and redirect URIs) for a path most Players skip entirely.

### Claiming is a device-side sweep at sign-up

On successful sign-up the client offers every Seat secret it holds; the server sets the owner on
each Seat that is still unowned. It works only on the device the guest played on, and the UI says
so. There is no way to prove a guest on one device was the same person as a guest on another,
and inventing one is out of scope.

### Finished Games get scoped

The existing query for finished Games takes no owner and returns every finished Game in the
deployment. It becomes scoped to the caller. This is a live defect today, not new work, and it
must land with or before the first ticket that lets two people share a deployment.

### Stats are derived, not stored

Head-to-head is computed from finished Games and their Seats. No records table, no counters to
keep in step, and no friend or group entity: "your opponents" is exactly the set of Users you
have shared a finished Game with. Abandoned Games are excluded. A guest Seat contributes nothing
until claimed, at which point past Games start counting without any backfill.

### Notifications are not built

Nothing tells a Player it is their Turn. Web push means a service worker, a permission prompt,
key management and stored subscriptions; email means the delivery problem rejected above. This
is the right second thing to build once Games are actually running across days.

## Testing Decisions

A good test here asserts a rulebook or product outcome, not a shape. The prior art is
`src/game/turn.test.ts`: it feeds a state and a sequence of events into the reducer and asserts
what the rules say should be true — never that a particular field was written. The reducer takes
randomness as event payload, so there is no seeded RNG, no mocking and no `convex-test` anywhere
in the suite. That property is worth more than any individual test and must survive this feature.

**Seam 1 — the existing reducer, extended.** Lobby behaviour is tested exactly where the 107
existing tests live: taking a Seat, a duplicate name inside one Game, a Seat attempted after the
start, starting with one Seat and with several, turn order following join order, and a move
attempted by the wrong Seat. Because the reducer already owns the Final round and the 6000 rule,
the interaction between multiple Seats and equal Turn counts is testable here too, with no new
machinery.

**Seam 2 — a new pure stats module, mirroring `src/game/history.ts`.** Head-to-head takes
finished Games with their Seats and returns records. It is tested the way history is: construct
inputs, assert the derived answer. The cases that matter are abandoned Games excluded, guest
Seats skipped, a three-Seat Game producing the right pairwise records, a draw counting as neither
a win nor a loss, and best-Turn selection across Games.

**Deliberately untested.** The Convex mutations, the secret comparison, `localStorage`, the
sign-in flow and the claim sweep. These are wiring and I/O; every rule they enforce is behind a
seam above, so what is left is thin enough to verify by hand. Adding `convex-test` to cover them
would cost the suite its no-mocking property for very little.

## Out of Scope

- Notifications of any kind — push, email, or in-app.
- Claiming guest history across devices, or any proof that a guest on one phone is a User on
  another.
- Chat, reactions, or any communication inside the app.
- Rematch, tournaments, seasons, or league tables.
- Personal-improvement statistics — averages, Niete rate, TUTTO counts. The `turns` records
  already support them; the decision was that head-to-head goes first.
- Removing a Seat, skipping a Turn, or any timeout mechanic.
- Password reset, email verification, or account deletion.
- Ranking or a global leaderboard. Head-to-head is between people who have actually played.
- Replaying a finished Game move by move. The `turns` records exist for it, but it is not this.

## Further Notes

The Card design and draw animation work is a separate, smaller piece of work agreed in the same
session. It touches the Card slot and the deck in the play view and is independent of everything
here.

Two ADRs are to be written as part of this work: one recording that the Invite link identifies
the Game rather than a Seat, together with the device-only limit that follows; one recording that
Turns are never skipped, and why — the Final round's dependence on equal Turn counts is the kind
of reasoning that is invisible from the code and easy to break with a well-meaning timeout.

`CONTEXT.md` has already been updated during the design session: **Invite link** was rewritten to
say it identifies the Game, **Head-to-head** was added, and **Forcing Card** was added for the
Card design work. The **Game** entry still lists "room" under _Avoid_ — "open Game" is the phrase,
and there is no second noun for a Game people can join.
