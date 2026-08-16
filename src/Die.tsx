import type { CSSProperties } from "react";
import type { Face } from "./game/turn";
import {
  ALL_FACES,
  PIPS,
  faceTransform,
  restingRotation,
  startRotation,
} from "./dice";

/**
 * One die, drawn as a CSS cube. The resting rotation comes from the face the
 * server chose and the tumble animates into it, so the animation is a replay
 * of a decided Roll and can settle on nothing else (ADR 0001).
 */
export function Die({
  face,
  seed,
  tumble,
  faceClass,
}: {
  face: Face;
  /** Varies the tumble path only. Stable across re-renders, so nothing jumps. */
  seed: number;
  tumble: boolean;
  faceClass: string;
}) {
  const rest = restingRotation(face);
  const start = startRotation(face, seed);
  const style: CSSProperties & Record<string, string> = {
    transform: `rotateX(${rest.x}deg) rotateY(${rest.y}deg)`,
    "--from-x": `${start.x}deg`,
    "--from-y": `${start.y}deg`,
    animationDelay: `${(seed % 6) * 60}ms`,
  };

  return (
    <span className="die">
      <span className="sr-only">{face}</span>
      <span
        aria-hidden
        className={tumble ? "die-cube die-tumbling" : "die-cube"}
        style={style}
      >
        {ALL_FACES.map((side) => (
          <span
            key={side}
            className={`die-face ${faceClass}`}
            style={{ transform: faceTransform(side) }}
          >
            {PIPS[side].map(([column, row]) => (
              <span
                key={`${column}-${row}`}
                className="die-pip"
                style={{ gridColumn: column, gridRow: row }}
              />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
