import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cardFace, markLongestWord, type CardFamily } from "./cards";
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

/**
 * One flat mark per family, ours and drawn here: a star for the Cards that pay
 * you, two overlapping diamonds for the one that doubles you, a padlock for the
 * five that take the choice to Stop away. Nothing here is traced from or
 * imitates the published game's artwork.
 */
function FamilyMotif({ family }: { family: CardFamily }) {
  return (
    <svg
      aria-hidden
      className="card-motif"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      {family === "bonus" && (
        <path d="M12 2.2 14.9 9h7.1l-5.7 4.6L18.4 21 12 16.8 5.6 21l2.1-7.4L2 9h7.1Z" />
      )}
      {family === "multiplier" && (
        <>
          <path d="M7 2.5 12.5 12 7 21.5 1.5 12Z" />
          <path d="M17 2.5 22.5 12 17 21.5 11.5 12Z" opacity="0.6" />
        </>
      )}
      {family === "forcing" && (
        <>
          <path
            d="M7.4 10.5V7.4a4.6 4.6 0 0 1 9.2 0v3.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <rect x="4" y="10.2" width="16" height="11.3" rx="2.2" />
        </>
      )}
    </svg>
  );
}

/** The deck: face-down, three layers deep whatever the count says. */
export function CardStack({ left }: { left: number }) {
  return (
    // The wrapper takes the stack's share of the stat row; the stack itself is
    // one card wide in the middle of it, the same object as the Card below.
    <div className="flex-1">
      <div className="card-stack">
        {/* Always three layers. The count carries the truth, so the stack does
            not twitch when the last Card drawn puts all 56 back in. */}
        <span aria-hidden className="card-stack-layer card-frame card-back" />
        <span aria-hidden className="card-stack-layer card-frame card-back" />
        <div className="card-stack-layer card-frame card-back card-stack-top">
          <span aria-hidden className="card-wordmark">
            TUTTO
          </span>
          {/* Counting what is left in the deck is part of playing well. */}
          <span className="sr-only">Karten</span>
          <span className="text-xl font-bold">{left}</span>
        </div>
      </div>
    </div>
  );
}

/** The slot with no Card in it — dashed, and holding its full height. */
export function EmptyCardSlot() {
  return (
    // The same corner as a real card, so the gap is a card's worth of space.
    <div className="card-slot rounded-[0.6rem] border-2 border-dashed border-neutral-500/40" />
  );
}

/**
 * A Card that has just been drawn. Mounting is what plays the draw — it flies
 * out of the stack face-down and flips face-up on arrival — so a reload replays
 * it, exactly as a reload replays the dice tumble.
 */
export function DrawnCard({ card }: { card: Card }) {
  const { family, lede, mark, corner, effect } = cardFace(card);
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
            measures the pile instead and this offset goes. Left alone here on
            purpose: a portrait Card sits lower and narrower than the strip this
            was guessed against, so the guess is now further from the pile than
            it was — retuning it would be guessing twice. */}
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
            <div
              className={`card-side card-frame ${FAMILY_CLASS[family]}`}
              // How wide the mark has to fit — the CSS sizes it from this.
              style={
                { "--mark-longest": markLongestWord(mark) } as CSSProperties
              }
            >
              {/* The index in both corners, as a playing card carries it. The
                  middle of the card says the same thing, so this is decoration
                  to a screen reader. */}
              <span aria-hidden className="card-corner card-corner-start">
                {corner}
              </span>
              {lede !== null && (
                <span className="text-[0.55rem] font-bold tracking-[0.2em] uppercase opacity-80">
                  {lede}
                </span>
              )}
              {/* Split at the slash with a break the browser may take, because
                  Chrome takes none there on its own and »PLUS/MINUS« would run
                  off the card. `markLongestWord` sizes the mark by the same
                  split, so the two agree on where a line can end. */}
              <span className="card-mark">
                {mark.split("/").map((part, index, parts) => (
                  <span key={index}>
                    {part}
                    {index < parts.length - 1 && (
                      <>
                        {"/"}
                        <wbr />
                      </>
                    )}
                  </span>
                ))}
              </span>
              <FamilyMotif family={family} />
              <span aria-hidden className="card-corner card-corner-end">
                {corner}
              </span>
            </div>
            <div
              aria-hidden
              className="card-side card-side-back card-frame card-back"
            >
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
