/**
 * PROTOTYPE — throwaway. The Arcade die: a chunk with three faces showing.
 *
 * Two animation hooks and they are separate on purpose. `boxClass` moves the
 * die's box — where it falls from, its squash, its way out to the row — and
 * `cubeClass` turns the cube inside it, in real 3D. A motion language needs both
 * and needs them on their own timing.
 */
import type { CSSProperties } from "react";
import type { Face } from "../../game/turn";
import { Pips } from "../Pips";

export function ArcadeDie({
  face,
  size,
  chosen = false,
  spent = false,
  flat = false,
  boxClass = "",
  cubeClass = "",
  style,
  onClick,
}: {
  face: Face;
  size: string;
  chosen?: boolean;
  spent?: boolean;
  /** The row: too small to read a cube, so those stay square-on. */
  flat?: boolean;
  boxClass?: string;
  cubeClass?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const body = spent
    ? "linear-gradient(150deg, #3a3468, #2a2550)"
    : chosen
      ? "linear-gradient(150deg, #c6f24e, #a4d92e)"
      : "linear-gradient(150deg, #ffffff, #d9d5f0)";
  const pip = spent ? "#6b64a8" : chosen ? "#1d2408" : "#221d4a";
  const side = spent ? "#1c1838" : chosen ? "#6f9a15" : "#8f89b8";
  const top = spent ? "#4a4480" : chosen ? "#e2ff8c" : "#fbfaff";

  return (
    <span
      className="die-slot"
      onClick={onClick}
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        perspective: "18rem",
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
          transformStyle: "preserve-3d",
          filter: chosen ? "drop-shadow(0 0 12px #c6f24e80)" : "none",
          transition: "filter 140ms ease-out",
        }}
      >
        {/* The pulse a landing can throw off. Invisible unless a variant
            animates it, so a language that does not want one pays nothing. */}
        <span
          className="ring"
          aria-hidden
          style={{
            position: "absolute",
            inset: "-14%",
            borderRadius: "50%",
            border: `2px solid ${chosen ? "#c6f24e" : "#4ee0f2"}`,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        <span
          className={cubeClass}
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: flat ? "none" : "rotateX(-8deg) rotateY(12deg)",
          }}
        >
          <span
            style={{
              ...plane,
              background: body,
              transform: `translateZ(calc(${size} / 2))`,
            }}
          >
            <Pips face={face} colour={pip} />
          </span>
          {!flat && (
            <>
              <span
                style={{
                  ...plane,
                  background: side,
                  transform: `rotateY(90deg) translateZ(calc(${size} / 2))`,
                }}
              />
              <span
                style={{
                  ...plane,
                  background: top,
                  transform: `rotateX(90deg) translateZ(calc(${size} / 2))`,
                }}
              />
            </>
          )}
        </span>
      </span>
    </span>
  );
}

const plane: CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "16%",
  backfaceVisibility: "hidden",
};
