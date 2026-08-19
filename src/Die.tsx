import { useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import type { Face } from "./game/turn";
import { ALL_FACES, PIPS, faceTransform, restingTransform } from "./dice";
import { dieFlightMs } from "./settled";
import { dieSpinTransform } from "./spin";
import { throwPath } from "./throw";

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
 * The three planes that close the cube's corners, one per axis. Written once
 * rather than per die, because it is the same three turns every time.
 */
const CORES = ["none", "rotateY(90deg)", "rotateX(90deg)"];

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
  index,
  tilt = 0,
  plays,
  faceClass,
  wound = null,
}: {
  /**
   * The face the server chose. Ignored while `plays` is `spin`, where there is
   * no Roll to have a face from.
   */
  face: Face;
  /**
   * This die's place in the hand — the one thing that tells it apart from the
   * five beside it, and so the source of everything it does differently: the
   * path it tumbles down, the slot it leaves in, how long it turns for, and how
   * fast it winds up. Derived, never drawn, so two phones watching the same
   * Roll animate it identically (ADR 0001).
   */
  index: number;
  /**
   * How far off square this die came down, from `tiltDegrees` — a thrown hand
   * rather than a laid-out one.
   *
   * Nought by default, and that is the answer for every die outside a Roll. A
   * die in »Herausgelegt« has its `--die-box` pinned to `--die-size`, so it
   * reserves no room to turn in and a tilt there would put its corners over its
   * neighbours'. A die winding up has no resting rotation to decorate.
   *
   * A Player who asked for no movement gets it too, because it is not movement:
   * it is the angle the die is at, arrived at without anything moving. It is
   * also the same angle on every phone at the table, and withholding it would
   * show that Player a different arrangement from the one everyone else is
   * looking at — for no gain, since a die five degrees off square reads exactly
   * as well as one that is square.
   */
  tilt?: number;
  plays: Plays;
  faceClass: string;
  /**
   * When the wind-up in front of *this* screen started, or `null` for a throw
   * with no hold behind it — `Enter`, an assistive click, a table-mate's Roll
   * arriving, a phone that opened onto one it never saw wound up.
   *
   * What makes the tumble carry on from the hold rather than cut to a seeded
   * angle: `throw.ts` reads the speed and the orientation the hold left this
   * die at out of it. Ignored unless `plays` is `tumble`.
   */
  wound?: number | null;
}) {
  const still = useReducedMotion();
  const spinning = plays === "spin" && !still;
  const tumbling = plays === "tumble" && !still;
  // How long the hold had run by the time this die mounted, which is the frame
  // the Roll landed on and so the frame the eye sees the release on — the dice
  // keep turning until the Roll is there, which is what makes the wind-up cover
  // the round trip. Read once, when the die appears: a die already falling was
  // let go at one moment and not at every frame since.
  const [heldMs] = useState(() =>
    wound === null ? null : Math.max(0, Date.now() - wound),
  );
  // How long this die is in the air: its old slot and its old turn, now one
  // flight. The path is sampled over exactly that length, so the two cannot
  // drift apart, and `settled.ts` is still the one place that says how long the
  // screen waits for it.
  const flightMs = dieFlightMs(index);
  const path = tumbling
    ? throwPath({ face, index, tilt, heldMs, flightMs })
    : [];
  const style: CSSProperties & Record<string, string> = {
    // Winding up, the angle is this die's own share of the one the whole hand
    // is turning through, written onto the grid by `useSpin` — one pair of
    // numbers a frame for six dice, and the cube takes its own rate and phase
    // off them in `calc()`. Otherwise the die sits on its face.
    transform: spinning
      ? dieSpinTransform(index)
      : restingTransform(face, tilt),
    // The die's angle at each of the keyframe's stops. The whole of the path is
    // here rather than in an easing function, because the two axes no longer
    // decay at one rate — each takes its own whole turns to the face the server
    // chose. `throw.ts` carries that argument.
    ...Object.fromEntries(path.map((turned, at) => [`--t${at}`, turned])),
    // Overrides the 800ms `.die-tumbling` declares, which stays the number the
    // keyframe test ties to `TUMBLE_MS`.
    animationDuration: `${flightMs}ms`,
  };

  return (
    <span
      className={tumbling ? "die die-falling" : "die"}
      // The fall shares the die's own flight, so the two cannot drift apart —
      // `.die-falling` declares 800ms only so the rule reads on its own.
      style={tumbling ? { animationDuration: `${flightMs}ms` } : undefined}
    >
      {/* A die winding up has nothing to say: it is not a Roll, it has no face,
          and reading out a number for it would be inventing one. */}
      {!spinning && <span className="sr-only">{face}</span>}
      <span
        aria-hidden
        className={tumbling ? "die-cube die-tumbling" : "die-cube"}
        style={style}
      >
        {/* Three opaque planes through the middle of the cube, so no rounded
            corner can show through it. `index.css` on `.die-core` carries why this
            is worth three extra elements on the most-repeated object on the
            screen. They wear the die's own ground and nothing else. */}
        {CORES.map((turn) => (
          <span
            key={turn}
            aria-hidden
            className={`die-core ${faceClass}`}
            style={{ transform: turn }}
          />
        ))}
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
