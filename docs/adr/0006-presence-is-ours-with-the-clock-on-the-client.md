# Presence is a table of our own, with the clock on the client

The Convex guidelines in `convex/_generated/ai/guidelines.md` say that ephemeral presence — who is
online, tracked by client heartbeats — belongs to the `@convex-dev/presence` component, and that a
hand-rolled `lastSeen` table is the wrong answer because it "needs wall-clock query filters that go
stale, and per-session rows break the one-entry-per-user contract". `CLAUDE.md` makes that file
binding and says it overrides what we think we know. This app departs from it: `convex/presence.ts`
is a `presence` table of check-ins, one row per Seat, written by a heartbeat and read raw.

The departure is not the table. It is the sentence after it. Both of the guideline's objections are
objections to a shape we do not have.

**The wall-clock filter is not on the server.** `presence.forGame` applies no threshold at all: it
returns every check-in in the Game with its timestamp, and `src/presence.ts` decides present-or-away
against the client's own clock, re-asked on a timer. That is not stylistic. Convex re-runs a query
when its _data_ changes, never as time passes, so a threshold applied inside the query would be
computed once and then frozen — and it would freeze hardest in the one case presence exists for, the
Seat that has stopped writing anything. A Player who walked away would stay green until some
unrelated write happened to re-run the query. Moving the clock to the client is what makes "away"
arrive on its own; it is the fix for the guideline's own objection, not a way around it.

**There are no per-session rows.** A check-in is keyed by Game and Seat and upserted, so the row
_is_ the Seat: two tabs of the same browser share the secret out of `localStorage` and both write
the same row, and there is exactly one entry per Seat however many of them are open. The
one-entry-per-user aggregation the component offers is aggregation over session identity, which
this app never mints — the Seat is the identity, and it is the identity presence is asked about
(»Platz 3 ist gerade weg«, never »Anna auf zwei Geräten«).

The cost is real and accepted: **a device with a badly set clock misreads the whole table.** It reads
every Seat's `lastSeen` against its own idea of now, so a phone an hour fast shows everybody away and
a phone an hour slow shows everybody present, including Players who left yesterday. A server-side
threshold would misread nobody. We take it because the failure is uniform, silent and harmless —
presence blocks nothing, skips no Turn and ends no Game (ADR 0005), so the worst outcome is a Player
who is told wrongly that nobody is going to move — where the stale-query failure is targeted at
exactly the Seat the feature is about. Wrong for everyone occasionally beats wrong for the one that
matters always.

A smaller cost comes with it, and is paid rather than accepted: a device holding the clock has only
just started holding it, so for the first moments it cannot tell a quiet Seat from one it has not
had time to hear from — including its own, whose first check-in has not come back yet. `presence.ts`
answers _not yet known_ for one heartbeat rather than guessing away, which is why the dot has three
states and not two.

Two things would reverse this. If presence ever has to be **per User rather than per Seat** — the
same account open on a phone and a laptop, shown as one person — the aggregation is real work and
the component already does it. And if anything on the server ever has to **act** on a Player going
quiet, the client's clock stops being enough: a server that must notice absence needs to hold the
threshold itself. Nothing here does today, and ADR 0005 forbids the obvious candidate, a timeout
that skips a Turn. Adding either is the moment to take the dependency rather than grow this table.
