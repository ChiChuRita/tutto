# 07 — Head-to-head

**What to build:** A stats screen for signed-in Players. Your best single Turn ever at the top,
then one row per opponent: Spiele, Siege, Niederlagen. »Your opponents« is derived — it is exactly
the set of Users you have shared a finished Game with, so there is no friend list to build and
nothing to manage.

Abandoned Games are excluded: they have final scores but no winner, and walking away from a
stalled Game must not count as a loss. Guest Seats contribute nothing, because there is nobody to
record against — until they are claimed, at which point they start counting on their own.

The derivation is a pure module beside the existing Turn-history one, taking finished Games with
their Seats and returning records. No stored counters and no records table: nothing to keep in
step, and claiming a guest Seat needs no backfill.

**Blocked by:** 05 — Accounts.

**Status:** ready-for-agent

- [ ] A signed-in Player sees a stats screen; a guest is told what signing up would give them
- [ ] The screen shows the Player's best single Turn across all their Games
- [ ] One row per opponent, showing Games shared, wins and losses
- [ ] A Game won by more than one Seat counts as neither a win nor a loss for those Seats
- [ ] Abandoned Games appear nowhere in the numbers
- [ ] Guest Seats are skipped, so a Game against guests shows no opponent rows
- [ ] A Game with three or more Seats produces the right record against each opponent
- [ ] A Player with no finished Games sees an empty state, not a broken screen
- [ ] The derivation is a pure module with its own tests, mirroring the existing Turn-history
      module — no mocking and no database in the test
