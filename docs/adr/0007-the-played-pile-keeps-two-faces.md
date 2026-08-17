# The played pile keeps two faces, and never a history

The played pile shows the Card in force face-up on top, the Card played before it face-up beneath at
a different angle so both edges show, and everything older as a blank edge. With no Card in force —
the start of a Turn, and just after a TUTTO — the last Card played is the face on top, and it lies
there until somebody plays another. The Game document carries exactly one new field for this:
`lastCard`, the newest Card played that the Turn is no longer holding.

This reopens a decision that had been settled the other way. The pile used to draw every buried Card
as a blank edge, including the one directly under the Card in force, because the Game held the deck
as counts plus the Card in force and nothing else. Recording the whole history was considered and
refused: up to 56 entries growing on the document every device subscribes to, for decoration.

Seeing it on a phone changed the ask, and the ask turned out to be far cheaper than the option that
was refused. **One Card, not a list.** The Card just replaced goes on the document as a single
optional field. It does not grow over a Game, it is the only new thing the position has to carry,
and it buys the two things the old pile got wrong: a Card that vanishes the instant the next one is
drawn, and an empty slot drawn over a stack of edges at the start of every Turn, which is not what a
table looks like.

**One field and never a list, and the line is not aesthetic.** A list is a history, and a history of
what has been played is a fact about the deck read the other way round — the thing ADR 0003 keeps
out of the document by construction. That ADR is about the deck's _order_ and says nothing about the
pile, so it does not decide this; but its argument does apply here, and the reason `lastCard` is
safe is that a single Card is not an order. Everyone watched it arrive one draw ago. Two Cards deep
is where it stops: three would be a history with a small number on it, and the number would grow the
next time somebody saw the pile on a phone.

**A phone joining mid-Game must see the same pile.** This is why the field is on the Game document
and not in client memory, which was tried and failed: a Spectator opening the Invite link, a reload,
the next Player's phone waking — none of them saw the earlier draws, and the pile has to be
identical on every device at the table. It is also why the resting angles are derived from a Card's
place in the pile rather than dealt at random: a re-render must not reshuffle the pile, and two
phones must not disagree about it. And it is why it is read off the document rather than out of the
`turns` history, which would be a second subscription on the play screen for one value.

The cost is real and accepted, and it is visible: **at the end of every Turn the Card beneath blanks
to an edge.** Handing the Turn on moves `lastCard` up to be the face on top, and the Card that was
under it is one the position no longer holds — so it is drawn as the blank edge it is, in place, at
the same angle, with no animation. Nothing moved and nothing was drawn, so nothing may fly; it is a
face going quiet where it lies. That is the position being honest about what it knows rather than a
glitch, and it is the shape of every honest answer here: the pile can say how deep it is and what
its top two faces are, and it cannot say anything else.

What would reverse this is a rule that needs the history — nothing in the 2024 rulebook does — or a
second field wanted for a third face, which is the point to come back here rather than add it.
