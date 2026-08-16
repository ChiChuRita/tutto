# Turns are never skipped, and no Seat can be removed

Once a Game has started, its Seats are fixed and every one of them takes every Turn it is owed. There
is no timeout, no "skip", no kick, and no way to drop a Seat that has gone quiet. A Player who stops
answering leaves the Game exactly where it stands, for as long as it takes.

The reason is not politeness, it is the 6000 rule. Reaching 6000 does not win: it opens the Final
round, which runs until every Seat has taken the **same number of Turns**, and only then does the
highest score win. Skip one Seat's Turn and the counts can never level again — either the Final round
never ends, or it ends with someone having had one Roll fewer than the Player who beat them. Removing
a Seat is the same wound from the other side: the scores that decided the Final round would no longer
be all the scores. Turn counts are the Game's clock, and a skip stops the clock.

A timeout is the obvious well-meaning change here, and this ADR exists to forbid it. It reads as pure
kindness — nobody wants a Game frozen for a week because one friend went on holiday — and it is easy
to add without ever opening `turn.ts`: a cron that advances `activeSeatIndex` after N days looks like
a scheduling concern rather than a rules change. It is a rules change. Anything that advances the
Turn without the Seat playing it breaks the Final round, and the tests that would catch it are in the
reducer, which such a change never touches.

The escape already exists: **abandoning** the Game. Any seated Player may end it for everyone. The
scores stand, no winner is named, and it is left out of head-to-head stats, so a stalled Game costs
nobody a loss. That is the whole answer to a Player who has gone quiet, and it is deliberately a
blunt one — ending the Game for everybody is honest about what has happened, where a silent skip
pretends the Game is still the Game it was.

The cost is real and accepted: one unresponsive Player can strand four others, and their only move
is to bin the Game rather than finish it without him. The alternative is a Game whose ending cannot
be trusted, which is worse for a Game whose whole point is arguing about who won.
