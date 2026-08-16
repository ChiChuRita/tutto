# 01 — A Game has a URL

**What to build:** Opening the app shows the Games this device is in, not a single »Neues Spiel«
button. Tapping one opens it, and the Game's id is in the URL — so the address bar is now the
thing that identifies a Game, and a bookmark or a pasted link gets you back to it. Creating a
Game navigates to its URL.

This is prefactoring: no rule changes, no new domain concepts. It exists because an Invite link
cannot exist until a Game is addressable, and because both of the next two tickets assume it.

It also closes a live defect. The query for finished Games currently takes no owner and returns
every finished Game in the deployment — invisible with one Player, a leak the moment two people
share a deployment. After this ticket the client asks for the Games it knows about, so the
unscoped query goes away rather than being fixed.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The start screen lists the Games this device is in, newest first, with each Game's state
      readable at a glance (in progress, finished, abandoned)
- [ ] Creating a Game navigates to that Game's URL
- [ ] Opening a Game's URL directly loads that Game
- [ ] Reloading mid-Game keeps you in the same Game
- [ ] Going back from a Game returns to the list without losing it
- [ ] The device remembers every Game it has opened, not just the most recent one
- [ ] No query returns Games belonging to another device
- [ ] A Game id in the URL that does not exist shows a plain "not found" state, not a crash
- [ ] Existing solo play is unchanged end to end: create, play a full Game, see it finished
