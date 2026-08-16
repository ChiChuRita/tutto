# Server-authoritative dice

Every die roll is generated inside a Convex mutation, together with the validation and the score
update, so the whole thing is one transaction nobody can forge. The client never generates a
random number. The consequence — and the reason this looks odd from the outside — is that the
roll animation is a **replay of a result that already exists**, not a simulation that produces
one. If you find yourself wanting a physics engine to decide what the dice show, this is the
decision you are about to break.
