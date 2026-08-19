/**
 * PROTOTYPE — throwaway. The Roll, frame by frame.
 *
 * Same instrument as the Card's filmstrip and for the same reason: a die is in the
 * air for 620ms and whatever is wrong with the throw is wrong for about 60ms of
 * it. Each frame below is the real animation held still — `animation-play-state:
 * paused` with a negative `animation-delay` — so nothing here is a redrawing of
 * what the throw is supposed to do.
 *
 * One die, not the hand: the stagger between six dice is a separate question from
 * whether one of them falls properly, and a strip of six answers neither. `--i` is
 * pinned to 0 so every frame is the first die's own timing.
 *
 * The strip's own override has to come *after* the motion language's stylesheet to
 * win the cascade — same specificity, later wins — which is why the two `<style>`
 * blocks below are in that order.
 */
import { PaperDie } from "./Die";
import { SPECS } from "./spec";
import { rollPath } from "./throw";
import type { Face } from "../../game/turn";

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const QUIET = "#7c7669";

/**
 * Where the frames are taken, in percent of the flight — dense around 62%, which
 * is the impact. Everything a fall gets wrong, it gets wrong within 60ms of
 * touching the table, and a strip spread evenly over 620ms walks straight past it.
 */
const AT = [0, 20, 40, 56, 62, 65, 67, 70, 74, 78, 82, 86, 92, 100];

const FACE: Face = 5;

export function PaperDieStrip({ specKey }: { specKey: string }) {
  const spec = SPECS.find((candidate) => candidate.key === specKey) ?? SPECS[0];
  // The die's own flight, without the stagger: `settleMs` is the whole hand
  // landing, and the base animations here are 620ms in Satz.
  const ms = 620;
  const freeze = AT.map(
    (at, index) => `
.f${index} .roll-out, .f${index} .roll-cube {
  animation-play-state: paused;
  animation-delay: -${Math.round((at / 100) * ms)}ms;
}`,
  ).join("");

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
      <style>{spec.css}</style>
      <style>{freeze}</style>
      <div
        style={{
          borderTop: `2px solid ${INK}`,
          paddingTop: 6,
          marginBottom: 10,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 400 }}>
          {spec.key} — {spec.name}, Wurf Bild für Bild
        </h2>
        <p style={{ fontSize: 11, color: QUIET, lineHeight: 1.35 }}>
          {ms}ms pro Würfel. Die Linie ist der Tisch, auf dem er liegen soll.
        </p>
      </div>
      <div
        className={`mv-${spec.key}`}
        style={{
          // Three across and not four: a die's box is 1.8× its size, so four
          // columns on a phone are narrower than one box and the frames overlap
          // each other. The strip has to give a die the room the table gives it.
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px 2px",
        }}
      >
        {AT.map((at, index) => (
          <div key={at} style={{ display: "flex", flexDirection: "column" }}>
            {/* The box a die takes in the hand, with a rule where the die's own
                bottom edge belongs — most of what looks wrong in a fall is the
                die not being where the ground is. */}
            <div
              className={`f${index}`}
              style={{
                ["--i" as string]: "0",
                position: "relative",
                // Room for the whole fall: the die starts 190% of its own height
                // above the table, plus the box it sweeps in.
                height: "calc(var(--die-size) * 3.6)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              <PaperDie
                face={FACE}
                size="var(--die-size)"
                cube
                path={rollPath(FACE)}
                boxClass="roll-out"
                cubeClass="roll-cube"
              />
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 1,
                  background: QUIET,
                  opacity: 0.5,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 9,
                fontFamily: "ui-monospace, monospace",
                color: QUIET,
                marginTop: 3,
              }}
            >
              {at}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
