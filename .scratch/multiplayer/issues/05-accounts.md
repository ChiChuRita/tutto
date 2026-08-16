# 05 — Accounts

**What to build:** Signing up, signing in and signing out. Sign-up takes an email, a password and
a display name — the display name because head-to-head needs something to print and the provider
gives us only an email.

A signed-in Player taking a Seat types nothing: the Seat is taken under their profile name and
records them as its owner. A guest is unaffected and still plays a full Game without an account.

Authentication is already installed and configured with the email-and-password provider. Use it.
Magic links and third-party sign-in were both considered and rejected — each adds infrastructure
for a path most Players skip entirely.

Nothing about this ticket gates play. Creating a Game, taking a Seat and finishing a Game must
all still work with no account at all.

**Blocked by:** 03 — Joining from the link.

**Status:** ready-for-agent

- [ ] A Player can sign up with an email, a password and a display name
- [ ] A Player can sign in on another device and be recognised
- [ ] A Player can sign out
- [ ] A signed-in Player takes a Seat under their profile name without typing one
- [ ] A Seat taken by a signed-in Player records its owner; a guest's Seat has no owner
- [ ] A guest can still create a Game, take a Seat and play it to the end with no account
- [ ] Signed-in and guest Seats can sit in the same Game
- [ ] The display name shows wherever Seat names show — lobby, play, result
