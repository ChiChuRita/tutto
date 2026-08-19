/**
 * PROTOTYPE — throwaway. The contact sheet: every Card in the deck, in all three
 * treatments, on the Papier ground.
 *
 * A card design cannot be judged one card at a time. The set has to hold
 * together — five Bonus numerals that differ by one digit, a multiplier that is
 * not one of them, and five drawn Forcing faces that have to read apart from each
 * other at 91px. That is what this page is for, and it is the fastest way to see
 * whether the redrawn marks are actually better than the ones they replace.
 *
 * All eleven come off `cards.ts`, so this cannot drift from the real deck.
 */
import { PaperCard, PaperCardBackFace } from "./CardFace";
import { CARD_STYLES } from "./cardStyles";
import type { Card } from "../../game/turn";

const DECK: Card[] = [
  "bonus200",
  "bonus300",
  "bonus400",
  "bonus500",
  "bonus600",
  "x2",
  "stop",
  "fireworks",
  "straight",
  "plusMinus",
  "cloverleaf",
];

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const QUIET = "#7c7669";

export function PaperSheet() {
  return (
    <div
      style={{
        background: PAPER,
        color: INK,
        minHeight: "100dvh",
        padding: 16,
        paddingBottom: 80,
        fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {CARD_STYLES.map((style) => (
        <section
          key={style.key}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 6 }}>
            <h2 style={{ fontSize: 19, fontWeight: 400 }}>
              {style.key} — {style.name}
            </h2>
            <p style={{ fontSize: 11, color: QUIET, lineHeight: 1.35 }}>
              {style.blurb}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DECK.map((card) => (
              <PaperCard key={card} card={card} style={style.key} />
            ))}
            {/* The back, at the end of its own row: it is one drawing for all
                three, and seeing it beside them is how you tell whether it
                belongs to the same press. */}
            <PaperCardBackFace
              left={56}
              style={{
                position: "relative",
                width: "var(--card-width)",
                height: "var(--card-height)",
                fontSize: "calc(var(--card-height) / 6)",
                flex: "none",
              }}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
