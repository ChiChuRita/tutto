# The deck is remaining counts, not a shuffled order

The 56-card deck is stored as a count of each card type still available, and a draw picks
weighted-randomly from what remains inside the mutation. It is **not** stored as a pre-shuffled
ordered array.

This is deliberately the less realistic model. A shuffled array is the honest simulation of a
physical deck, but it means the entire future of the match — including the position of the single
Cloverleaf, which wins the game outright — sits on the Game document that every player subscribes
to. Protecting it would depend on remembering to strip a field from every query, forever. Counts
make the leak impossible by construction, are statistically identical, and still let players count
cards. The only thing lost is the ability to reveal the deck order afterwards, which nobody wants.

This is about the deck and its order. What the _played_ pile keeps — two faces and never a history —
is ADR 0007, which borrows this argument but is not decided by it.
