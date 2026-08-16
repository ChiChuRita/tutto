# 07 — Turn history and abandoning

**What to build:** Finished Games stop disappearing. Every completed Turn is recorded in full, so
that the Games played from now on can answer questions nobody has asked yet — the stats screen is
out of scope, but the data it will need must exist before it is built, because history cannot be
reconstructed later.

A recorded Turn is a full replay: the Cards drawn, every Roll's six faces, what was set aside at
each step, each Tutto, and how the Turn ended — stopped, Niete, Stop Card, or abandoned.

History goes to its own table indexed by Game, not onto the Game document. Every Seat subscribes to
the Game document, so anything parked there is re-pushed to every device on every change; history
kept there would grow the payload with every Roll.

A Player can also abandon a Game in progress. An abandoned Game keeps its final scores but has no
winner and is excluded from win and loss counts — a distinction the stats work will depend on.

**Blocked by:** 06 — The forcing Cards

**Status:** ready-for-agent

- [x] Each completed Turn is written to a history table indexed by Game
- [x] A recorded Turn holds the Cards drawn, every Roll's six faces, each set-aside step, each Tutto, and how the Turn ended
- [x] The Game document holds only live state and does not grow as a Game progresses
- [x] A Player can abandon a Game in progress
- [x] An abandoned Game keeps final scores, records no winner, and is marked as abandoned
- [x] Finished and abandoned Games appear in a list the Player can open
- [x] Recording history does not change any rules behaviour or existing test
