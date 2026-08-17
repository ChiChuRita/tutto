# 01 — Clear the template, add vitest

**What to build:** The app boots to an empty German shell with none of the create-convex demo left
in it. Nothing is playable yet — this ticket exists so that every ticket after it starts from a
clean floor rather than working around the starter's example code.

The demo `numbers` table, the example Convex functions, and the template's React page all go. The
Convex Auth wiring stays exactly as it is: this slice creates no Users and gates nothing, but
removing auth would mean rebuilding it later.

Vitest arrives here as the only new dev dependency, wired to a `test` script, so the next ticket
can write the first test without also setting up a test runner.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] The demo table is gone from the schema and the example Convex functions are deleted
- [x] The template's demo UI is gone; the app renders an empty shell with a German page title
- [x] Convex Auth configuration is untouched and the app still starts cleanly
- [x] `npm run lint` and `npm run typecheck` pass with no warnings
- [x] `npm test` runs vitest and exits successfully with no tests present
- [x] No other dependency is added

## Reconciliation

Reconciled on 2026-08-17 against the shipped code, which is live at
<https://chichurita.github.io/tutto/> with its backend on Convex. This file said `ready-for-agent`
long after the work shipped: the early parallel lanes never came back to update it, and only the
lanes worked one at a time kept it current.

The boxes were ticked in bulk from the built and deployed feature, against evidence that each
ticket's artefacts exist — not by re-verifying every criterion one at a time. Read a tick here as
"this shipped", not as "this was re-tested today".
