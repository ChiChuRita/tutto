/**
 * PROTOTYPE — throwaway. Variant B, "Papier".
 *
 * Direction: quiet, printed, editorial. Warm paper, one near-black ink, one
 * terracotta accent, and nothing else. No slab of colour anywhere — the table is
 * defined by two hairlines and the air between them, the way a printed page
 * defines a block. Type does the work that colour was doing.
 *
 * Structure: no boxes. The Card is a full-width band with the wager set into its
 * right edge; the Seats are one ranked line of type; the dice lie on the page
 * itself between two rules; the moves are a pill and a plain word.
 */
import { useState } from "react";
import type { Face } from "../game/turn";
import { Pips } from "./Pips";
import { POSITION as P } from "./state";

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const RULE = "#d9d3c6";
const CLAY = "#b4552d";
const QUIET = "#7c7669";

function Die({
  face,
  size,
  chosen = false,
  spent = false,
  onClick,
}: {
  face: Face;
  size: number | string;
  chosen?: boolean;
  spent?: boolean;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      style={{
        position: "relative",
        display: "block",
        width: size,
        height: size,
        borderRadius: "26%",
        background: chosen ? CLAY : spent ? "transparent" : PAPER,
        border: `1.5px solid ${chosen ? CLAY : spent ? RULE : INK}`,
        transition: "background 120ms ease-out, border-color 120ms ease-out",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Pips face={face} colour={chosen ? PAPER : spent ? RULE : INK} />
    </span>
  );
}

export function VariantB() {
  const [chosen, setChosen] = useState<number[]>([0, 3]);
  const toggle = (index: number) =>
    setChosen((now) =>
      now.includes(index)
        ? now.filter((other) => other !== index)
        : [...now, index],
    );

  return (
    <div
      style={{
        background: PAPER,
        color: INK,
        padding: "calc(var(--play-pad) + 6px)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        gap: "calc(var(--play-gap) + 4px)",
        fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
      }}
    >
      {/* The Card as a band across the page, the wager set into its right edge.
          One object where the real screen has three. */}
      <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2
            style={{
              flex: 1,
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            {P.card.name}
          </h2>
          <span
            style={{
              fontSize: 34,
              lineHeight: 1,
              color: CLAY,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {P.wager.toLocaleString("de-DE")}
          </span>
        </div>
        <p
          style={{
            marginTop: 4,
            fontSize: 13,
            lineHeight: 1.45,
            color: QUIET,
            maxWidth: "30ch",
          }}
        >
          {P.card.effect}
        </p>
      </div>

      {/* The deck as a sentence with a tap in it, not as a stack of rectangles. */}
      <button
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderTop: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
          padding: "8px 0",
          fontFamily: "inherit",
          fontSize: 13,
          color: QUIET,
          background: "transparent",
          textAlign: "left",
        }}
      >
        <span
          style={{
            textDecoration: `underline 1px ${CLAY}`,
            textUnderlineOffset: 4,
          }}
        >
          Karte ziehen
        </span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {P.deckLeft} im Stapel · {P.beneath.name} zuletzt
        </span>
      </button>

      {/* The Seats as one ranked line of type. No chips, no tiles, no bars. */}
      <ol
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          fontSize: 14,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {P.seats.map((seat, rank) => (
          <li
            key={seat.name}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              fontWeight: seat.turn ? 700 : 400,
              color: seat.turn ? INK : QUIET,
            }}
          >
            <span style={{ width: "1.2em", color: QUIET, fontSize: 11 }}>
              {rank + 1}
            </span>
            <span style={{ flex: 1 }}>
              {seat.name}
              {seat.turn && <span style={{ color: CLAY }}> ·</span>}
            </span>
            <span>{seat.score.toLocaleString("de-DE")}</span>
          </li>
        ))}
      </ol>

      {/* The table: no fill, no border, no radius. Two rules and the air
          between them, which is what a printed block is. */}
      <div
        style={{
          borderTop: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
          padding: "16px 0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            placeItems: "center",
          }}
        >
          {P.roll.map((face, index) => (
            <Die
              key={index}
              face={face as Face}
              size="var(--die-size)"
              chosen={chosen.includes(index)}
              onClick={() => toggle(index)}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 11, color: QUIET, fontStyle: "italic" }}>
            herausgelegt
          </span>
          {P.setAside.map((face, index) => (
            <Die
              key={index}
              face={face as Face}
              size="var(--play-set-aside)"
              spent
            />
          ))}
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.4,
          fontStyle: "italic",
          color: QUIET,
          minHeight: 36,
        }}
      >
        {P.news}
      </p>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          style={{
            minHeight: 54,
            borderRadius: 999,
            background: INK,
            color: PAPER,
            fontFamily: 'Georgia, "Iowan Old Style", serif',
            fontSize: 18,
          }}
        >
          herauslegen <span style={{ color: "#e0a883" }}>+{P.gain}</span>
        </button>
        <button
          style={{
            minHeight: 40,
            background: "transparent",
            color: QUIET,
            fontFamily: "inherit",
            fontSize: 15,
            textDecoration: `underline 1px ${RULE}`,
            textUnderlineOffset: 5,
          }}
        >
          aufhören
        </button>
      </div>
    </div>
  );
}
