# 05 — Type with a voice

**What to build:** A rounded, heavy display face for headings and numbers, so the app stops sounding
like a settings screen.

**Blocked by:** `01 — The table turns light`

**Status:** done

## Why this one matters more than it looks

The app is set in the system sans at every size, and that is quietly most of why it reads as a
prototype. The reference's headings are the loudest signal in it: **very heavy, rounded terminals,
tight tracking, near-black**. »Statistics« and »Recommended games« are doing as much work as any
colour in that mockup.

Two roles, and they are not the same:

- **Display** — screen headings, the numbers on the tiles, the app's own name, the Card's mark. Heavy
  and rounded.
- **Text** — everything a Player reads as a sentence: the Card's effect line, the message under the
  table, form labels, the record's rows. This stays a plain, quiet, highly legible face. A rounded
  display face set at 12px in a paragraph is worse than what is there now.

## What must not break

- **Weight is not free.** A web font is bytes on a phone. Report the cost the way `card-design 03`
  reported the motion library's — measured off `npm run build`, gzipped, before and after — and
  subset it to the characters the German UI actually uses. »ä ö ü ß « »« and the digits.
- **The fold budget is measured in pixels of text.** A face with different metrics changes every
  reserved height: `--play-slot`, `--card-effect-line`, the message line, the corner index. Re-measure
  all three viewports and both leaderboard regimes.
- **The corner index is 10px.** Whatever face carries it has to stay legible at that size on all four
  Card grounds — that is the hardest typographic constraint in the app, and it is the one to test
  first, not last.
- **Nothing shifts between phases**, which means no reflow when a font finishes loading: reserve the
  space, and say what the fallback is while it loads.
- German is a long language — »herauslegen«, »weitermachen«, »Stop-Karte« — and the play screen is
  390px wide. Tighter tracking must not push a move's label onto two lines.
- `src/game/turn.ts` and everything under `convex/` are untouched.

- [x] Headings and numbers are set in a heavy rounded display face
- [x] Sentences stay in a quiet, legible text face — the display face is not used for paragraphs
- [x] The corner index is legible at its real size on all four Card grounds
- [x] The font's gzipped cost is measured and reported, and it is subset to the UI's characters
- [x] No layout shift when the font loads; the fallback is named
- [x] No move's label wraps to two lines at 390px
- [x] The play screen does not scroll at the three viewports — numbers reported, both regimes

## Comments

Shipped, and cheaper than the ticket assumed. `--font-display` is `ui-rounded` — the CSS generic
Safari resolves to SF Pro Rounded, already on the device. **No download, no swap, no reflow through
the reserved heights**, which is the whole risk the ticket was worried about, avoided rather than
managed.

Be honest about the fallback: on Android and desktop Chrome `ui-rounded` does not resolve and the
stack lands on `system-ui`, the face that was there before. So this is free where it lands and a no-op
where it does not — and it is an iPhone this game is played on. A subset webfont is the upgrade if
the fallback ever matters, and the ticket's measuring requirement carries over to it.

Headings, the app's name, the score numbers and the Card's mark and corner index take it. Sentences
do not: a rounded face at 12px in a paragraph is worse than the plain one.
