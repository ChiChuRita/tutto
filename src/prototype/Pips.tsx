/** PROTOTYPE — throwaway. Pip geometry only; every variant draws its own die body. */
import type { CSSProperties } from "react";
import { PIPS } from "../dice";
import type { Face } from "../game/turn";

export function Pips({
  face,
  colour,
  size = "78%",
  style,
}: {
  face: Face;
  colour: string;
  /** Pip diameter as a share of its cell in the 3×3 grid. */
  size?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: "16%",
        display: "grid",
        gridTemplate: "repeat(3, 1fr) / repeat(3, 1fr)",
        placeItems: "center",
        ...style,
      }}
    >
      {PIPS[face].map(([column, row]) => (
        <span
          key={`${column}-${row}`}
          style={{
            gridColumn: column,
            gridRow: row,
            width: size,
            aspectRatio: "1",
            minWidth: 3,
            borderRadius: "50%",
            background: colour,
          }}
        />
      ))}
    </span>
  );
}
