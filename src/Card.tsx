import { motion, useReducedMotion } from "motion/react";
import { cardFace, type CardFamily } from "./cards";
import type { Card } from "./game/turn";

/**
 * The Card in front of the Player, and the deck it came out of. The draw is a
 * replay, not a deal: the server already chose the Card (ADR 0001) and the deck
 * is only a count of what is left (ADR 0003), so nothing here knows or asks
 * what the next Card will be.
 */

/** Seconds the flight takes, and so how long the flip waits before it starts. */
const FLIGHT = 0.4;

/** Green pays you, blue multiplies you, red takes the choice away. */
const FAMILY_CLASS: Record<CardFamily, string> = {
  bonus: "bg-green-700 text-white",
  multiplier: "bg-blue-700 text-white",
  forcing: "bg-red-700 text-white",
};

/** The deck: face-down, three layers deep whatever the count says. */
export function CardStack({ left }: { left: number }) {
  return (
    <div className="card-stack flex-1">
      {/* Always three layers. The count carries the truth, so the stack does not
          twitch when the last Card drawn puts all 56 back in. */}
      <span aria-hidden className="card-stack-layer card-back" />
      <span aria-hidden className="card-stack-layer card-back" />
      <div className="card-stack-layer card-back card-stack-top">
        <span aria-hidden className="card-wordmark">
          TUTTO
        </span>
        {/* Counting what is left in the deck is part of playing well. */}
        <span className="sr-only">Karten</span>
        <span className="text-2xl font-bold">{left}</span>
      </div>
    </div>
  );
}

/** The slot with no Card in it — dashed, and holding its full height. */
export function EmptyCardSlot() {
  return (
    <div className="card-slot rounded-xl border-2 border-dashed border-neutral-500/40" />
  );
}

/**
 * A Card that has just been drawn. Mounting is what plays the draw — it flies
 * out of the stack face-down and flips face-up on arrival — so a reload replays
 * it, exactly as a reload replays the dice tumble.
 */
export function DrawnCard({ card }: { card: Card }) {
  const { family, lede, mark, effect } = cardFace(card);
  // The one mechanism for reduced motion in the app: the library's hook. With
  // no initial state to animate out of, the Card is simply there, face-up.
  const still = useReducedMotion();
  return (
    <div>
      <div className="card-slot">
        {/* Two beats, not one compound move: the flight out of the stack, then
            the flip. Both are `transform` only, so they stay on the compositor.
            Where the stack sits relative to the slot is guessed, not measured —
            up in the stat row and over to the right. `-6.5rem` is a length of
            its own, deliberately not a share of the card's height, so resizing
            the Card cannot quietly move where the flight begins. Ticket 05
            measures the pile instead and this offset goes. */}
        <motion.div
          className="card-flight"
          initial={still ? false : { x: "33%", y: "-6.5rem", scale: 0.3 }}
          animate={{ x: "0%", y: "0rem", scale: 1 }}
          transition={{ duration: FLIGHT, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <motion.div
            className="card-flip"
            initial={still ? false : { rotateY: 180 }}
            animate={{ rotateY: 0 }}
            transition={{
              duration: 0.38,
              delay: FLIGHT,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <div className={`card-side ${FAMILY_CLASS[family]}`}>
              {lede !== null && (
                <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80">
                  {lede}
                </span>
              )}
              <span className="card-mark">{mark}</span>
            </div>
            <div aria-hidden className="card-side card-side-back card-back">
              <span className="card-wordmark">TUTTO</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
      {/* What the Card does stays outside it, small and grey. */}
      <p className="mt-2 text-center text-sm opacity-70">{effect}</p>
    </div>
  );
}
