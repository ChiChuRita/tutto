# 02 — Gold is small type and must be read

**What to build:** The »letzte Runde« line clears 4.5:1.

**Blocked by:** None

**Status:** done

`--color-gold` is `#a46718` at **4.03:1** on the page. It is set at `--play-note-text` — 10px to 14px,
`font-semibold` — so it is small type and owes 4.5:1. `#996016` is 4.53:1 and the same hue.

`index.css` claims every accent »is the lightest value of its hue that still clears 4.5:1 as *type* on
the page«. Three did not: gold 4.03, azure 4.11, jade 4.07. Gold is the only real failure — azure is
only ever a filled background under white type (4.72:1) or a focus ring, and jade is a presence dot.
Both are graphic objects owing 3:1, which they clear. The comment overstated the rule and is corrected
to name the job each colour actually does.

- [x] Gold clears 4.5:1 as type on the page
- [x] The stated rule matches the values, per colour, by job
