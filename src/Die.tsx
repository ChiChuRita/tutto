import type { CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import type { Face } from "./game/turn";
import {
  ALL_FACES,
  PIPS,
  faceTransform,
  restingRotation,
  startRotation,
} from "./dice";
import { dieDelayMs } from "./settled";

/**
 * One face of a die: the pips on their 3×3 grid, and nothing else. Six of them
 * make the cube below; six of them in a row make the Straße Card's face, which
 * is why this is not folded back into `Die`. The size comes from whatever wears
 * it, so a die on a Card and a die in the hand are the same drawing.
 */
export function DieFace({
  face,
  className,
  style,
}: {
  face: Face;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden className={`die-face ${className}`} style={style}>
      {PIPS[face].map(([column, row]) => (
        <span
          key={`${column}-${row}`}
          className="die-pip"
          style={{ gridColumn: column, gridRow: row }}
        />
      ))}
    </span>
  );
}

/**
 * What a die is doing.
 *
 * `tumble` and `nothing` are both a die with a face: the resting rotation comes
 * from the face the server chose and the tumble animates into it, so the
 * animation is a replay of a decided Roll and can settle on nothing else
 * (ADR 0001).
 *
 * `spin` is the odd one and is odd on purpose. It is a die in the hand while
 * »Würfeln« is held down — before the Roll exists, turning on nothing. There is
 * no face yet, so it has none: which side happens to be up is whatever the
 * angle in `--spin-x`/`--spin-y` makes it, it changes sixty times a second, and
 * it is neither shown as a value nor read out as one. A face that could be read
 * off a die that has not been thrown is a face a Player could take for a
 * result.
 */
export type Plays = "tumble" | "spin" | "nothing";

/**
 * One die, drawn as a CSS cube.
 *
 * The tumble stays in CSS: a `preserve-3d` cube rotating into its resting face
 * is compositor work the library would only pull back onto the main thread.
 * What the library owns is whether it plays at all, so reduced motion is
 * decided in one place for the whole app rather than two — and that one place
 * turns the wind-up off as well, so a Player who asked for no movement presses
 * the button and simply gets their Roll.
 */
export function Die({
  face,
  seed,
  plays,
  faceClass,
}: {
  /**
   * The face the server chose. Ignored while `plays` is `spin`, where there is
   * no Roll to have a face from.
   */
  face: Face;
  /** Varies the tumble path only. Stable across re-renders, so nothing jumps. */
  seed: number;
  plays: Plays;
  faceClass: string;
}) {
  const still = useReducedMotion();
  const rest = restingRotation(face);
  const start = startRotation(face, seed);
  const spinning = plays === "spin" && !still;
  const style: CSSProperties & Record<string, string> = {
    // Winding up, the angle is the one the whole hand shares, written onto the
    // grid by `useSpin` — one pair of numbers a frame for six dice, and the
    // cube reads them here. Otherwise the die sits on its face.
    transform: spinning
      ? "rotateX(var(--spin-x, 0deg)) rotateY(var(--spin-y, 0deg))"
      : `rotateX(${rest.x}deg) rotateY(${rest.y}deg)`,
    "--from-x": `${start.x}deg`,
    "--from-y": `${start.y}deg`,
    // The stagger comes from `settled.ts`, which is also what works out how
    // long the news has to wait for this die — one number, not two.
    animationDelay: `${dieDelayMs(seed)}ms`,
  };

  return (
    <span className="die">
      {/* A die winding up has nothing to say: it is not a Roll, it has no face,
          and reading out a number for it would be inventing one. */}
      {!spinning && <span className="sr-only">{face}</span>}
      <span
        aria-hidden
        className={
          plays === "tumble" && !still ? "die-cube die-tumbling" : "die-cube"
        }
        style={style}
      >
        {ALL_FACES.map((side) => (
          <DieFace
            key={side}
            face={side}
            className={faceClass}
            style={{ transform: faceTransform(side) }}
          />
        ))}
      </span>
    </span>
  );
}
