# 05 — A record against nobody is not a record

**What to build:** An opponent the app cannot name is dropped from the record instead of rendered
nameless.

**Blocked by:** None

**Status:** done

`convex/stats.ts:115` read `name: opponent?.name ?? ""`. The row then rendered with a real record
and an empty name, so the record showed figures attributed to nobody.

**This ticket was written believing `?? ""` covered one case. It covers two.** The typecheck found
the second: `authTables.users` in `@convex-dev/auth` declares `name` as `v.optional(v.string())`
(`node_modules/@convex-dev/auth/dist/server/implementation/types.d.ts:40`), so `opponent.name` is
`string | undefined` even on a document that exists. The two ways to reach a nameless row are:

1. `ctx.db.get("users", id)` returns `null` — a User document gone while a Seat still names it.
2. The document is there and has no `name` — permitted by the schema. This app's own sign-up form
   requires one (`Account.tsx`, `required` on the input), but nothing in the schema does, so any
   other path to a User document can produce this.

Both are the same thing on screen and get the same answer. `opponent?.name` is `undefined` for
either, so one check covers both:

```ts
const name = opponent?.name;
if (name === undefined) return null;
```

Dropped in the query rather than in the component, and dropped rather than given a placeholder. A
placeholder invents a name for a person who exists, and the component is the wrong place because
the sentinel would have to be re-derived there.

This is the one ticket in this effort that does not depend on the visual ground, so it holds
whatever happens to the spec's stated assumption.

- [x] An opponent with no User document produces no row
- [x] An opponent whose User document has no `name` produces no row
- [x] No row in the record has an empty name
- [x] The remaining rows keep their order and their figures
- [x] The `?? ""` fallback is gone rather than moved

## Comments

The `?? ""` was not sloppiness: it was one expression quietly covering a missing document and a
missing field, and reading it as only the first is what made this ticket's original body wrong.
`tsc` is what caught it, which is the argument for running the typecheck before believing a
one-line fix.
