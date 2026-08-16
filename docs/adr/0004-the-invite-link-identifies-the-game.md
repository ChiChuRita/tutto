# The Invite link identifies the Game, not a Seat

The Invite link is the Game's URL and nothing more. It grants no Seat by itself: whoever opens it
sees the lobby and takes a Seat as a deliberate act on arrival. Taking one mints a secret that the
browser keeps, and every mutation acting on a Seat carries that secret and refuses one it does not
recognise.

The alternative was a per-Seat link — a secret baked into the URL, one per Seat, handed out by the
creator. It was rejected because it cannot tell an account from a guest: a User taking a Seat under
their profile arrives at the same URL as a stranger, and the link would have to grant a Seat before
anyone knows which of the two it is. It also buys nothing, because the device still needs its own
proof for every move after joining — so the per-Seat link is a second credential on top of the one
that has to exist anyway, plus the job of generating and distributing N links instead of one.

Two costs come with this, both accepted knowingly.

The secret is a **bearer credential**: whoever holds it is that Seat. Anyone who obtains it can play
that Seat's Turns. For a dice game among friends, sharing a link into a group chat, that is the
right trade against a sign-up wall — and an account (ADR 0002) is what will offer anything stronger.

A Seat **cannot be recovered on another device**. The secret lives in the browser's storage, so a
refresh keeps your Seat and clearing site data loses it, with no way back in — the server has
nothing to check a claim against. There is deliberately no recovery flow for a guest; signing up and
claiming the Seat is the path to a Seat that outlives one browser.

One consequence for the schema: the secrets live in their own table, never on the Seat. Every device
subscribes to the whole Game document, so a secret stored there would be handed to the whole table —
the same leak ADR 0003 avoids with the deck.
