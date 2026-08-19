/**
 * PROTOTYPE — throwaway. The *real* components on the Papier ground.
 *
 * Not another variant: this mounts the app's own `CardStack`, `PlayedPile`,
 * `CardEffect` and `Die` with fabricated props, so the fold can be looked at
 * without a Convex deployment and a seated Game behind it. The play screen is the
 * screen this whole restyle is about and it is the one screen a dev server cannot
 * reach on its own — everything else about the ground can be judged on the start
 * screen, and this is what is left.
 *
 * Delete it with the rest of `src/prototype/`. It exists to answer one question:
 * do the real Cards and the real dice come out looking like the drawings they were
 * chosen from.
 */
import { useRef, useState } from "react";
import { LazyMotion, domMax } from "motion/react";
import { CardEffect, CardStack, PlayedPile } from "../Card";
import { Die } from "../Die";
import { ALL_FACES, tiltDegrees } from "../dice";
import type { Card } from "../game/turn";
import type { Face } from "../game/turn";

const DECK: Card[] = [
  "bonus400",
  "x2",
  "stop",
  "fireworks",
  "straight",
  "plusMinus",
  "cloverleaf",
];

const inHand = "bg-die text-ink";
const chosen = "bg-clay text-on-accent";
const spent = "bg-base text-edge";

export function RealTable() {
  const pile = useRef<HTMLElement | null>(null);
  const [at, setAt] = useState(0);
  const [roll, setRoll] = useState(0);
  const [picked, setPicked] = useState<number[]>([1, 4]);
  const faces: Face[] = [5, 1, 3, 5, 2, 4];

  return (
    <LazyMotion features={domMax} strict>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-(--play-gap) p-(--play-pad)">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="font-utility text-(length:--play-note-text)/(--play-note) tracking-[0.14em] text-muted uppercase">
              Im Zug
            </div>
            <div className="font-display text-3xl tabular-nums text-clay">
              1.250
            </div>
          </div>
          <CardStack
            left={41 - at}
            label="Karte ziehen"
            disabled={false}
            onDraw={() => setAt((n) => (n + 1) % DECK.length)}
            ref={pile}
          />
          <PlayedPile
            top={DECK[at]}
            beneath={DECK[(at + DECK.length - 1) % DECK.length]}
            inForce
            left={41 - at}
            pile={pile}
          />
        </div>

        <CardEffect card={DECK[at]} />

        <div className="grid grid-cols-3 grid-rows-[repeat(2,var(--die-box))] justify-items-center border-y border-edge">
          {faces.map((face, index) => (
            <button
              key={`${roll}-${index}`}
              onClick={() =>
                setPicked((now) =>
                  now.includes(index)
                    ? now.filter((other) => other !== index)
                    : [...now, index],
                )
              }
            >
              <Die
                face={face}
                index={index}
                tilt={tiltDegrees(`r${roll}`, index)}
                plays="tumble"
                faceClass={picked.includes(index) ? chosen : inHand}
              />
            </button>
          ))}
        </div>

        <div className="flex min-h-(--play-set-aside) flex-wrap items-center gap-(--play-set-aside-gap) border-b border-edge pb-(--play-pad) [--die-box:var(--play-set-aside)] [--die-size:var(--play-set-aside)]">
          {ALL_FACES.slice(0, 4).map((face, index) => (
            <Die
              key={face}
              face={face}
              index={index}
              plays="nothing"
              faceClass={spent}
            />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-(--play-gap)">
          <button
            className="min-h-(--play-slot) w-full rounded-control bg-azure px-4 font-display text-lg font-bold text-on-accent pressable"
            onClick={() => setRoll((n) => n + 1)}
          >
            Würfeln
          </button>
          <button className="min-h-(--play-slot) w-full rounded-control bg-raised px-4 font-display text-lg shadow-soft pressable">
            aufhören
          </button>
          <p className="text-center text-(length:--play-note-text)/(--play-note) text-gold">
            letzte Runde — die höchste Punktzahl gewinnt
          </p>
        </div>
      </main>
    </LazyMotion>
  );
}
