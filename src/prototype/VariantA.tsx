/**
 * PROTOTYPE — throwaway. Variant A, "Nachttisch".
 *
 * Direction: a real table in low light. Deep ink-blue ground, a green felt slab
 * with a brass hairline, warm brass for anything that is a number, and ivory
 * casino dice with crimson pips that cast a shadow. Depth is back — this
 * variant argues the flat composition is what made the app read as a form.
 *
 * Structure: the wager is the hero, alone on its own line above the felt. The
 * two piles sit in a slim brass-ruled bar. The scoreboard is a horizontal strip
 * of three chips, not a stack of rows.
 */
import { useState } from "react";
import type { Face } from "../game/turn";
import { Pips } from "./Pips";
import { POSITION as P } from "./state";

const INK = "#0b1220";
const FELT = "#14532d";
const FELT_EDGE = "#b08d3f";
const BRASS = "#e0b352";
const CHALK = "#f4f1e8";
const DIM = "#8f9bb0";

function Die({
  face,
  size,
  tilt = 0,
  chosen = false,
  spent = false,
  onClick,
}: {
  face: Face;
  size: number | string;
  tilt?: number;
  chosen?: boolean;
  spent?: boolean;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "block",
        borderRadius: "22%",
        transform: `rotate(${tilt}deg) translateY(${chosen ? "-6px" : "0"})`,
        transition: "transform 140ms ease-out, box-shadow 140ms ease-out",
        background: spent
          ? "linear-gradient(160deg, #6e7686, #4d5563)"
          : "linear-gradient(160deg, #ffffff, #e8e2d2)",
        boxShadow: chosen
          ? `0 10px 18px rgb(0 0 0 / 0.5), 0 0 0 3px ${BRASS}`
          : "0 4px 10px rgb(0 0 0 / 0.45), inset 0 -2px 4px rgb(0 0 0 / 0.12)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Pips face={face} colour={spent ? "#2b3140" : "#b31217"} />
    </span>
  );
}

export function VariantA() {
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
        background: `radial-gradient(120% 80% at 50% 0%, #16223a 0%, ${INK} 70%)`,
        color: CHALK,
        padding: "var(--play-pad)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        gap: "var(--play-gap)",
        fontFamily: '"Avenir Next", Avenir, system-ui, sans-serif',
      }}
    >
      {/* The wager, alone and huge. Nothing shares its line. */}
      <div style={{ textAlign: "center", paddingTop: 4 }}>
        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.24em",
            color: DIM,
            textTransform: "uppercase",
          }}
        >
          Im Zug
        </div>
        <div
          style={{
            fontSize: "clamp(2.5rem, 14vw, 3.75rem)",
            lineHeight: 0.9,
            fontWeight: 600,
            color: BRASS,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 12px rgb(224 179 82 / 0.25)",
          }}
        >
          {P.wager.toLocaleString("de-DE")}
        </div>
      </div>

      {/* The piles, in a slim brass-ruled bar rather than as two big objects. */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 10,
          padding: 8,
          borderRadius: 6,
          background: "rgb(255 255 255 / 0.04)",
          border: "1px solid rgb(224 179 82 / 0.22)",
        }}
      >
        <button
          style={{
            width: 62,
            height: 88,
            borderRadius: 5,
            background: "linear-gradient(150deg, #1d2a44, #101a2e)",
            border: `1px solid ${FELT_EDGE}`,
            color: BRASS,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.5)",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600 }}>{P.deckLeft}</span>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", color: DIM }}>
            KARTEN
          </span>
        </button>
        <div
          style={{
            flex: 1,
            borderRadius: 5,
            padding: "10px 12px",
            background: "linear-gradient(150deg, #1b4fa8, #12327080)",
            border: "1px solid rgb(255 255 255 / 0.18)",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.4)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 600 }}>{P.card.name}</span>
          <span
            style={{
              fontSize: 11,
              lineHeight: 1.3,
              color: "rgb(244 241 232 / 0.8)",
            }}
          >
            {P.card.effect}
          </span>
        </div>
      </div>

      {/* Three chips across, not three stacked rows. */}
      <div style={{ display: "flex", gap: 6 }}>
        {P.seats.map((seat) => (
          <div
            key={seat.name}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 4,
              background: seat.turn ? BRASS : "rgb(255 255 255 / 0.06)",
              color: seat.turn ? INK : CHALK,
              border: seat.turn ? "none" : "1px solid rgb(255 255 255 / 0.08)",
            }}
          >
            <div
              style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.8 }}
            >
              {seat.name.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {seat.score.toLocaleString("de-DE")}
            </div>
          </div>
        ))}
      </div>

      {/* The felt. A real slab with a brass rule and an inner shadow, so the
          dice are lying in a well rather than on a flat rectangle. */}
      <div
        style={{
          borderRadius: 10,
          padding: 14,
          background: `radial-gradient(120% 100% at 50% 0%, #1a6b3a, ${FELT})`,
          border: `1.5px solid ${FELT_EDGE}`,
          boxShadow:
            "inset 0 6px 20px rgb(0 0 0 / 0.45), 0 6px 18px rgb(0 0 0 / 0.4)",
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
            gap: 10,
            placeItems: "center",
          }}
        >
          {P.roll.map((face, index) => (
            <Die
              key={index}
              face={face as Face}
              size="var(--die-size)"
              tilt={[-7, 4, -3, 8, -5, 6][index]}
              chosen={chosen.includes(index)}
              onClick={() => toggle(index)}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: "1px solid rgb(224 179 82 / 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "rgb(244 241 232 / 0.55)",
              writingMode: "vertical-rl",
            }}
          >
            HERAUSGELEGT
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
        style={{ textAlign: "center", fontSize: 12, color: DIM, minHeight: 32 }}
      >
        {P.news}
      </p>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          style={{
            minHeight: 52,
            borderRadius: 6,
            background: `linear-gradient(180deg, #f0c568, ${BRASS})`,
            color: INK,
            fontSize: 17,
            fontWeight: 700,
            boxShadow: "0 4px 0 #9d7b2c, 0 8px 16px rgb(0 0 0 / 0.4)",
          }}
        >
          herauslegen (+{P.gain})
        </button>
        <button
          style={{
            minHeight: 46,
            borderRadius: 6,
            background: "transparent",
            border: "1px solid rgb(244 241 232 / 0.3)",
            color: CHALK,
            fontSize: 15,
          }}
        >
          aufhören
        </button>
      </div>
    </div>
  );
}
