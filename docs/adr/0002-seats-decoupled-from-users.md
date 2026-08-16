# Seats are decoupled from Users

A Seat is a place in a Game; a User is a registered account. A Seat's owner is **nullable**,
because an invited guest can play from the link without signing up and claim the Seat later. This
is deliberate: a sign-up wall before your friends can roll a die is what kills a party game.

The cost is paid everywhere — every stats query has to handle a Seat with no owner, and "wins
against Anna" has to survive Anna being a guest in one Game and an account in the next. That cost
was accepted knowingly, because making the owner required later would mean rewriting the schema
and discarding guest history.
