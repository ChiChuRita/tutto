/**
 * PROTOTYPE — throwaway. The deal, frame by frame.
 *
 * A deal is 900ms long and everything that is wrong with one is wrong for about
 * 80ms of it, which is why looking at it in a browser and guessing does not
 * converge. This page renders the same deal many times over, each copy held still
 * at a fixed point in it: `animation-play-state: paused` with a negative
 * `animation-delay` freezes a CSS animation at exactly that offset, so every frame
 * here is the real animation and not a redrawing of it.
 *
 * Each frame shows the deck and the slot together, because most of what goes wrong
 * in this deal is about where the Card is relative to those two — not about the
 * Card itself.
 */
import { PaperCardBackFace, PaperCardFlip } from "./CardFace";
import type { CardStyle } from "./cardStyles";
import { FLIPS } from "./flips";
import type { Card } from "../../game/turn";

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const QUIET = "#7c7669";

/** Where the frames are taken, in percent of the deal. */
const AT = [0, 12, 18, 24, 32, 40, 48, 56, 64, 72, 80, 88, 94, 100];

const CARD: Card = "bonus400";
const STYLE: CardStyle = "CD";

function Frame({ at, ms, axis }: { at: number; ms: number; axis: "x" | "y" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span
          style={{
            display: "block",
            position: "relative",
            width: "var(--card-width)",
            height: "var(--card-height)",
            fontSize: "calc(var(--card-height) / 6)",
            flex: "none",
          }}
        >
          <PaperCardBackFace left={40} />
        </span>
        <div
          style={{
            // The shell's optics, repeated here on purpose: a filmstrip drawn
            // through a different lens is measuring a different animation.
            perspective: "28rem",
            perspectiveOrigin: "0% 50%",
            width: "var(--card-width)",
            flex: "none",
          }}
        >
          <div
            className="flip"
            style={{
              ["--deal" as string]: "calc(var(--card-width) + 8px)",
              width: "var(--card-width)",
              transformStyle: "preserve-3d",
              // The frame: the animation is paused and wound forward to `at`.
              animationPlayState: "paused",
              animationDelay: `-${Math.round((at / 100) * ms)}ms`,
            }}
          >
            <PaperCardFlip card={CARD} style={STYLE} backAxis={axis} />
          </div>
        </div>
      </div>
      <span
        style={{
          fontSize: 9,
          fontFamily: "ui-monospace, monospace",
          color: QUIET,
        }}
      >
        {at}% · {Math.round((at / 100) * ms)}ms
      </span>
    </div>
  );
}

export function PaperStrip({ flipKey }: { flipKey: string }) {
  const flip = FLIPS.find((candidate) => candidate.key === flipKey) ?? FLIPS[0];
  return (
    <div
      style={{
        background: PAPER,
        color: INK,
        minHeight: "100dvh",
        padding: 14,
        paddingBottom: 80,
        fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
      }}
    >
      {/* The frames are static, so this one cannot restart anything — but it is
          the same stylesheet the shell has to be careful with. */}
      <style>{flip.css}</style>
      <div
        style={{
          borderTop: `2px solid ${INK}`,
          paddingTop: 6,
          marginBottom: 10,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 400 }}>
          {flip.key} — {flip.name}, Bild für Bild
        </h2>
        <p style={{ fontSize: 11, color: QUIET, lineHeight: 1.35 }}>
          {flip.ms}ms. Stapel links, Fach rechts.
        </p>
      </div>
      <div
        className={`fl-${flip.key}`}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 6px",
        }}
      >
        {AT.map((at) => (
          <Frame key={at} at={at} ms={flip.ms} axis={flip.axis} />
        ))}
      </div>
    </div>
  );
}
