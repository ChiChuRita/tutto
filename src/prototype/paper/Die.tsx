/**
 * PROTOTYPE — throwaway. The Papier die, and it has no holes in it.
 *
 * At rest it is exactly the flat printed die of the ground round: a paper square
 * with an ink hairline round it and ink pips on it, square-on, no perspective and
 * no visible sides. That is the whole trick — a die that rests square cannot show
 * a corner, so the only moment a hole could open is mid-tumble.
 *
 * Mid-tumble it is closed two ways over:
 *
 *  - Every face is `backface-visibility: hidden`, so a rounded corner does not
 *    show the far face's ink through it.
 *  - Three opaque paper planes cross the middle of the cube, one per axis. A
 *    corner hole looks through the cube, and there is now always paper behind it.
 *    `index.css` names this fix and turns it down for the real screen because it
 *    is three extra elements on the most-repeated object on the table. In a
 *    prototype it is free, and it is what proves the look is available.
 *
 * Two animation hooks, and they are separate on purpose: `boxClass` moves the
 * die's box — where it falls from, its squash, its way out to the row — and
 * `cubeClass` turns the cube inside it.
 */
import type { CSSProperties } from "react";
import type { Face } from "../../game/turn";
import { Pips } from "../Pips";
import { ALL_FACES, faceTransform, restingTransform } from "../../dice";

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const RULE = "#d9d3c6";
const CLAY = "#b4552d";

/** The corner. One number, because the faces and the cores must agree on it. */
const CORNER = "20%";

export function PaperDie({
  face,
  size,
  chosen = false,
  spent = false,
  cube = false,
  boxClass = "",
  cubeClass = "",
  path,
  style,
  onClick,
}: {
  face: Face;
  size: string;
  chosen?: boolean;
  spent?: boolean;
  /** A real cube, for the variants that tumble one. Flat otherwise. */
  cube?: boolean;
  boxClass?: string;
  cubeClass?: string;
  /**
   * The turns this die takes on its way down, one per `STOPS` entry, written onto
   * the cube as `--r0…`. The keyframe reads them, so the path lives in TypeScript
   * where the resting rotation can be read — see `throw.ts` for why it has to.
   */
  path?: string[];
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const body = chosen ? CLAY : spent ? "transparent" : PAPER;
  const edge = chosen ? CLAY : spent ? RULE : INK;
  const pip = chosen ? PAPER : spent ? RULE : INK;
  const skin: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: body,
    borderRadius: CORNER,
    // A drawn hairline rather than a border: a border would change the box, and
    // on a cube face an inset shadow keeps every face the same size.
    boxShadow: `inset 0 0 0 1.5px ${edge}`,
    backfaceVisibility: "hidden",
  };

  return (
    <span
      onClick={onClick}
      style={{
        display: "grid",
        placeItems: "center",
        // A cube is widest across its space diagonal, about 0.88 of an edge from
        // the centre, so a die that tumbles needs 1.8× its own size of room. The
        // real screen reserves that in `--die-box` and `index.css` carries the
        // measurement; a prototype that reserves only the resting square gets the
        // bug that looks like clipping — each die is its own flattened stacking
        // context, so a later one paints its opaque faces over whatever swung
        // into the gap, along a hard straight edge.
        width: cube ? "calc(" + size + " * 1.8)" : size,
        height: cube ? "calc(" + size + " * 1.8)" : size,
        // Only the tumbling variants need depth, and a die that rests square-on
        // is unaffected by it either way.
        perspective: cube ? "20rem" : undefined,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <span
        className={boxClass}
        style={{
          position: "relative",
          width: size,
          height: size,
          transformStyle: cube ? "preserve-3d" : undefined,
        }}
      >
        {cube ? (
          <span
            className={cubeClass}
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              // Square-on at rest, showing the face that was rolled. The
              // rotations are all multiples of 90°, so no side is visible and
              // the die reads as the printed square it is at rest.
              //
              // This is also what the tumble lands on rather than anything the
              // keyframes say: no motion spec here declares a `100%`, so the
              // animation interpolates into the element's own transform — the
              // same mechanism as the real screen, where it is what makes a die
              // incapable of settling on a face nobody rolled (ADR 0001).
              transform: restingTransform(face, 0),
              // The path down, one stop per `STOPS`. A tumble reads these; a die
              // that is not tumbling simply has unused custom properties.
              ...Object.fromEntries(
                (path ?? []).map((turned, at) => [`--r${at}`, turned]),
              ),
            }}
          >
            {/* The three planes through the middle. Nothing to read on them —
                they are only ever glimpsed through a corner. */}
            {["none", "rotateY(90deg)", "rotateX(90deg)"].map((turn) => (
              <span
                key={turn}
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: body === "transparent" ? PAPER : body,
                  borderRadius: CORNER,
                  transform: turn,
                }}
              />
            ))}
            {ALL_FACES.map((side) => (
              <span
                key={side}
                style={{ ...skin, transform: faceTransform(side) }}
              >
                <Pips face={side} colour={pip} />
              </span>
            ))}
          </span>
        ) : (
          <span className={cubeClass} style={skin}>
            <Pips face={face} colour={pip} />
          </span>
        )}
      </span>
    </span>
  );
}
