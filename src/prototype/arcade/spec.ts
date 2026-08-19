/**
 * PROTOTYPE — throwaway. Three motion languages for the Arcade ground, which won
 * the first round. The skin is fixed now; what varies is how things move.
 *
 * Every spec is a block of CSS scoped under `.mv-<key>`, and the shell always
 * renders the same hooks, so a variant animates whichever of them it cares about:
 *
 *   .roll-out   the die's box — where it comes from, and its squash
 *   .roll-cube  the cube inside it — the tumble, in real 3D
 *   .ring       a pulse behind a die (hidden unless a variant animates it)
 *   .fly        a die leaving the hand for the row
 *   .land       a die arriving in the row
 *   .draw       the Card coming off the deck
 *   .jolt       the well itself
 *   .flash      a full-screen wash
 *
 * The die's stagger comes off `--i`, its rough vector to the row off `--dx`/`--dy`
 * (see the shell — approximated per column rather than measured, which is a
 * prototype shortcut; the real thing measures the berth like `Game.tsx` does).
 *
 * `settleMs` is only used to re-enable the buttons, so nothing is tapped
 * mid-flight.
 */
export type Spec = {
  key: string;
  name: string;
  blurb: string;
  settleMs: number;
  drawMs: number;
  flyMs: number;
  css: string;
};

/** Where every tumble has to end: the cube's resting tilt in the Arcade skin. */
const REST = "rotateX(-8deg) rotateY(12deg)";

export const SPECS: Spec[] = [
  {
    key: "MA",
    name: "Wurf",
    blurb: "Gewicht. Fällt von oben, quetscht auf, der Tisch wackelt.",
    settleMs: 1100,
    drawMs: 640,
    flyMs: 460,
    css: `
/* Weight. The dice are thrown from above, land short, squash, bounce once and
   settle — and the table takes the hit, which is what sells the mass. */
.mv-MA .roll-out {
  animation: MA-drop 700ms cubic-bezier(0.3, 0.85, 0.3, 1) both;
  animation-delay: calc(var(--i) * 62ms);
}
@keyframes MA-drop {
  0%   { transform: translateY(-210%) scale(0.84); opacity: 0 }
  14%  { opacity: 1 }
  52%  { transform: translateY(0) scale(1) }
  60%  { transform: translateY(0) scaleX(1.2) scaleY(0.78) }
  73%  { transform: translateY(-24%) scaleX(0.93) scaleY(1.1) }
  86%  { transform: translateY(0) scaleX(1.07) scaleY(0.94) }
  100% { transform: translateY(0) scale(1) }
}
.mv-MA .roll-cube {
  animation: MA-tumble 700ms cubic-bezier(0.22, 0.8, 0.25, 1) both;
  animation-delay: calc(var(--i) * 62ms);
}
@keyframes MA-tumble {
  0%   { transform: rotateX(-520deg) rotateY(340deg) }
  100% { transform: ${REST} }
}
/* The last die lands at 62×5 + 700. The table answers it. */
.mv-MA .jolt {
  animation: MA-jolt 300ms ease-out both;
  animation-delay: 700ms;
}
@keyframes MA-jolt {
  0%, 100% { transform: translate(0, 0) }
  22%  { transform: translate(-4px, 3px) }
  48%  { transform: translate(4px, -2px) }
  72%  { transform: translate(-2px, 1px) }
}
/* Out of the hand on a heavy fall: fast away, no float. */
.mv-MA .fly {
  animation: MA-fly 460ms cubic-bezier(0.5, 0, 0.75, 0.4) both;
}
@keyframes MA-fly {
  0%   { transform: translate(0, 0) scale(1); opacity: 1 }
  70%  { opacity: 1 }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.3) rotate(90deg); opacity: 0 }
}
.mv-MA .land {
  animation: MA-land 320ms cubic-bezier(0.2, 1.5, 0.4, 1) both;
}
@keyframes MA-land {
  0%   { transform: scale(1.5) }
  55%  { transform: scaleX(1.25) scaleY(0.8) }
  100% { transform: scale(1) }
}
/* The Card is dealt: it comes off the deck sideways and is turned over hard. */
.mv-MA .draw {
  animation: MA-draw 640ms cubic-bezier(0.25, 0.9, 0.3, 1) both;
}
@keyframes MA-draw {
  0%   { transform: translate(96px, 14px) rotate(14deg) rotateY(180deg) scale(0.8) }
  55%  { transform: translate(0, 0) rotate(0deg) rotateY(180deg) scale(1) }
  56%  { transform: translate(0, 0) rotateY(180deg) }
  84%  { transform: rotateY(0deg) scaleX(1.04) scaleY(0.96) }
  100% { transform: rotateY(0deg) scale(1) }
}
`,
  },
  {
    key: "MB",
    name: "Neon",
    blurb: "Aufprall. Alles kommt aus dem Nichts, blitzt und pulst.",
    settleMs: 720,
    drawMs: 480,
    flyMs: 340,
    css: `
/* Impact and light. Nothing travels — everything arrives, fast, and the screen
   reacts to it. Short durations, hard overshoot, a pulse behind every landing. */
.mv-MB .roll-out {
  animation: MB-in 320ms cubic-bezier(0.16, 1.7, 0.4, 1) both;
  animation-delay: calc(var(--i) * 42ms);
}
@keyframes MB-in {
  0%   { transform: scale(0) rotate(-200deg); opacity: 0 }
  45%  { opacity: 1 }
  100% { transform: scale(1) rotate(0deg); opacity: 1 }
}
.mv-MB .roll-cube {
  animation: MB-spin 320ms linear both;
  animation-delay: calc(var(--i) * 42ms);
}
@keyframes MB-spin {
  0%   { transform: rotateX(-780deg) rotateY(600deg) }
  100% { transform: ${REST} }
}
/* The pulse each die throws off as it lands. */
.mv-MB .ring {
  animation: MB-ring 480ms ease-out both;
  animation-delay: calc(var(--i) * 42ms + 260ms);
}
@keyframes MB-ring {
  0%   { transform: scale(0.5); opacity: 0.85 }
  100% { transform: scale(2.4); opacity: 0 }
}
/* And the wash over the whole screen on the first landing, once. */
.mv-MB .flash {
  animation: MB-flash 300ms ease-out both;
  animation-delay: 250ms;
}
@keyframes MB-flash {
  0%   { opacity: 0 }
  18%  { opacity: 0.3 }
  100% { opacity: 0 }
}
/* A streak: the die stretches along its way out and is gone. */
.mv-MB .fly {
  animation: MB-fly 340ms cubic-bezier(0.7, 0, 0.9, 0.3) both;
}
@keyframes MB-fly {
  0%   { transform: translate(0, 0) scale(1); opacity: 1 }
  30%  { transform: translate(calc(var(--dx) * 0.2), calc(var(--dy) * 0.2)) scaleX(1.5) scaleY(0.7); opacity: 1 }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.24); opacity: 0 }
}
.mv-MB .land {
  animation: MB-land 260ms cubic-bezier(0.1, 1.8, 0.4, 1) both;
}
@keyframes MB-land {
  0%   { transform: scale(0); filter: brightness(3) }
  100% { transform: scale(1); filter: brightness(1) }
}
/* The Card is slammed onto the table out of nothing. */
.mv-MB .draw {
  animation: MB-draw 480ms cubic-bezier(0.14, 1.5, 0.35, 1) both;
}
@keyframes MB-draw {
  0%   { transform: scale(1.85) rotateY(180deg); opacity: 0 }
  22%  { opacity: 1 }
  62%  { transform: scale(0.96) rotateY(0deg) }
  100% { transform: scale(1) rotateY(0deg) }
}
.mv-MB .draw-wave {
  animation: MB-wave 620ms ease-out both;
  animation-delay: 120ms;
}
@keyframes MB-wave {
  0%   { transform: scale(0.7); opacity: 0.7 }
  100% { transform: scale(1.9); opacity: 0 }
}
`,
  },
  {
    key: "MC",
    name: "Gummi",
    blurb: "Elastisch. Kommt von unten hoch, schwingt aus, nichts ruckt.",
    settleMs: 1250,
    drawMs: 900,
    flyMs: 620,
    css: `
/* Elastic and slow. Everything arrives from below on a long overshoot and takes
   its time settling — the opposite bet to Neon: nothing snaps, nothing flashes,
   and the whole table feels like rubber. */
.mv-MC .roll-out {
  animation: MC-in 820ms cubic-bezier(0.18, 1.35, 0.28, 1) both;
  animation-delay: calc(var(--i) * 88ms);
}
@keyframes MC-in {
  0%   { transform: translateY(150%) scale(0.65) rotate(28deg); opacity: 0 }
  26%  { opacity: 1 }
  62%  { transform: translateY(-16%) scale(1.09) rotate(-7deg) }
  82%  { transform: translateY(4%) scale(0.98) rotate(3deg) }
  100% { transform: translateY(0) scale(1) rotate(0deg) }
}
.mv-MC .roll-cube {
  animation: MC-roll 820ms cubic-bezier(0.24, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 88ms);
}
@keyframes MC-roll {
  0%   { transform: rotateX(-340deg) rotateY(-260deg) }
  68%  { transform: rotateX(10deg) rotateY(26deg) }
  86%  { transform: rotateX(-14deg) rotateY(4deg) }
  100% { transform: ${REST} }
}
/* Over the table on an arc, not a line: the two axes are eased differently, so
   it rises before it falls into the row. */
.mv-MC .fly {
  animation: MC-fly 620ms cubic-bezier(0.35, 0.05, 0.4, 1) both;
}
@keyframes MC-fly {
  0%   { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1 }
  40%  { transform: translate(calc(var(--dx) * 0.45), calc(var(--dy) * -0.22)) scale(0.8) rotate(-140deg); opacity: 1 }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.3) rotate(-300deg); opacity: 0 }
}
.mv-MC .land {
  animation: MC-land 520ms cubic-bezier(0.16, 1.6, 0.3, 1) both;
}
@keyframes MC-land {
  0%   { transform: translateY(-90%) scale(0.5) }
  58%  { transform: translateY(0) scaleX(1.3) scaleY(0.74) }
  78%  { transform: translateY(-14%) scaleX(0.92) scaleY(1.1) }
  100% { transform: translateY(0) scale(1) }
}
/* The Card is fanned out of the deck and turned over lazily. */
.mv-MC .draw {
  animation: MC-draw 900ms cubic-bezier(0.2, 1.2, 0.3, 1) both;
}
@keyframes MC-draw {
  0%   { transform: translate(84px, 30px) rotate(26deg) scale(0.72) rotateY(180deg); opacity: 0 }
  20%  { opacity: 1 }
  46%  { transform: translate(18px, -14px) rotate(-8deg) scale(1.05) rotateY(180deg) }
  70%  { transform: translate(0, 0) rotate(0deg) scale(1.02) rotateY(46deg) }
  88%  { transform: rotateY(-12deg) scale(1) }
  100% { transform: rotateY(0deg) scale(1) }
}
`,
  },
];
