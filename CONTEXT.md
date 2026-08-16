# Tutto

A mobile-first web implementation of the dice game *Tutto* (ABACUSSPIELE, 1994 — 2024 edition
rules), played by several people at once over an invite link.

## Language

### The game

**Tutto**:
The event of setting aside all six dice within a single turn. The player may then stop, or draw
a new Card and reroll all six dice.
_Avoid_: "full house", "all-in", "clear". Never use "Tutto" on its own to mean the product —
say "the app" for that.

**Turn**:
One player's full sequence of Card draws and Rolls, ending when they Stop or throw a Null.

**Roll**:
One throw of the dice currently in hand. Every Roll must leave at least one valid die set aside,
or it is a Null.

**Null**:
A Roll containing no valid single die and no valid triplet. It ends the Turn and forfeits every
point accumulated during that Turn.
_Avoid_: bust, farkle, zilch, fail.

**Set aside**:
To commit a valid die or triplet from the current Roll to the Turn's score. Set-aside dice
return to the hand only after a Tutto.
_Avoid_: bank, hold, lock, keep.

**Stop**:
To voluntarily end a Turn and bank its points. Distinct from the **Stop Card**, which ends the
Turn involuntarily and banks nothing.

**Card**:
One of the 56 cards drawn at the start of a Turn and after every Tutto. Sets the special
condition in force for that stretch of the Turn.
_Avoid_: rule card, action card, effect.

**Forcing Card**:
A Card that takes the choice to Stop away — Stop Card, Feuerwerk, Straße, Plus/Minus, Kleeblatt.
The other Cards (the five Bonus Cards and x2) only change what the Turn is worth. This split is
the one that matters mid-Turn, so the UI shows it.
Note the five reach that outcome three different ways, so no single list in the code names them
all: three are refused outright, a Stop Card has already ended the Turn, and a Straße scores
nothing until its sixth number, which leaves no points to bank.
_Avoid_: special card, penalty card.

**Straight**:
1 through 6 set aside across a Turn. Worth 2000 and counts as a Tutto. While a Straight Card is
in force, "valid die" means a number not yet set aside — the normal scoring table is suspended.
_Avoid_: run, sequence.

**Cloverleaf**:
The single card requiring two consecutive Tuttos. Succeeding wins the Game outright at any score.
_Avoid_: volle Lotte, four-leaf clover.

**Final round**:
The stretch of play after a Player first reaches 6000, during which the remaining Players each
take enough Turns to equalise Turn counts. Highest score at the end wins — reaching 6000 first
does not win.
_Avoid_: sudden death, last round, endgame.

### The app

**Game**:
One complete play-through, from creation through to a winner. Persistent and untimed — it may
span days.
_Avoid_: match, session, room, table.

**Seat**:
A participant's place in a Game, holding their score and turn order. A Seat exists whether or
not a User owns it, and is the thing stats are recorded against.
_Avoid_: player (ambiguous between the human and their place), participant, member.

**Player**:
The human at a Seat, account or not.

**User**:
A registered account. A User may own many Seats across many Games. A Seat with no User is a
guest's, and may be claimed by a User later.
_Avoid_: account, profile, member.

**Invite link**:
The URL of a Game, which anyone holding it may take a Seat in. It identifies the Game, not a
Seat — taking a Seat is a deliberate act on arrival, and a User takes one under their profile
while a guest gives a name first.
_Avoid_: join code, room code, share link.

**Spectator**:
Someone viewing a Game without a Seat — either they opened the Invite link after play began,
or their Seat's Turn has passed. Tutto has no hidden information beyond the undrawn deck, so a
Spectator sees exactly what a Player sees.

**Head-to-head**:
One User's record against another — Games shared, wins, losses. Derived from the Games they have
both held a Seat in, so there is no group or friend list to create. Only Users appear: a guest's
Seat has no one to record against until it is claimed.
_Avoid_: leaderboard, ranking, versus.

**Abandoned**:
A Game ended early by a Player rather than by a win. It has final scores but no winner, and is
excluded from win/loss stats.
_Avoid_: cancelled, forfeited, quit.

## German UI wording

The interface is German; the code is English. These are the words the 2024 rulebook actually
uses, so the UI uses them exactly — don't translate afresh from the English identifiers.

| Code        | UI (German)        |
| ----------- | ------------------ |
| Tutto       | TUTTO              |
| Null        | Niete              |
| Triplet     | Drilling           |
| Set aside   | herauslegen        |
| Turn        | Zug                |
| Roll        | Wurf               |
| Stop        | aufhören           |
| Continue    | weitermachen       |
| Straight    | Straße             |
| Cloverleaf  | Kleeblatt          |
| Fireworks   | Feuerwerk          |
| Stop Card   | Stop-Karte         |
| Final round | letzte Runde       |
| Seat        | Platz              |
| Game        | Spiel              |

Note the collision survives translation: »TUTTO« is the event in German too. *Volle Lotte* is a
different, separate game — never use it here.
