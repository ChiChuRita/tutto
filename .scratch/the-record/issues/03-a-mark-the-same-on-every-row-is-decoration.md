# 03 — A mark the same on every row is decoration

**What to build:** The person mark comes off the record's rows and off `OpenGames`' rows. It stays
at the two sites where it varies or stands alone.

**Blocked by:** None

**Status:** done

`tiles.ts` deleted five hues and wrote down why: the mark was already stable and keyed by meaning,
so "It is the hue that was redundant." The same test applied to a list finds the same redundancy in
the other medium. Every opponent row in the record carries an identical `TILE.player` person icon
in a 44px well, distinguishing nothing, on a 390px row.

`TILE.player` has four call sites and they are not alike:

- `src/Stats.tsx:63`: repeated identically down a list. Remove.
- `src/OpenGames.tsx:52`: repeated identically down a list. Remove. This is the block whose rows
  carry the most text (joined seat names, a `Platz`/`Plätze` count, a date, and a `Beitreten`
  stamp), so it is where the 44px is worth most.
- `src/Account.tsx:68`: one stub, saying "this is you" among unlike panels. Keep.
- `src/Game.tsx:1258`: the winner takes `bg-stock text-ink` instead, so it varies. Keep.

Both lists are fixed, not just the one this effort is about: `CLAUDE.md` is explicit that patching
only the path the ticket names leaves the siblings broken. The rule is one sentence and it holds at
two sites.

`TILE.player` itself stays, with three consumers left.

While in `tiles.ts`: the comment at line 28 says "thirty call sites name them". The real count is
seven `TILE.` references across four files. Correct the number or drop the claim.

- [x] Opponent rows in the record carry no mark, and the name has that width
- [x] `OpenGames` rows carry no mark, and the names have that width
- [x] `Account.tsx` and `Game.tsx` still draw theirs
- [x] `TILE.player` is still exported and still used
- [x] `tiles.ts` does not state a call-site count that is wrong
<<<<<<< HEAD

## Comments

Landed with the Tippschein ground, which is the only base it could land on: the vocabulary it is
written in (`field`, `field-machine`, `legend`, `receipt`, `reversed`) is that ground's. Ticket 05
went ahead of it in `34a6e46`, being a backend correctness fix that touches no ground.
