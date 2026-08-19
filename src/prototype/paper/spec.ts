/**
 * PROTOTYPE — throwaway. Three motion languages for Papier, which is the ground
 * that won. The skin is fixed; what varies is how it moves.
 *
 * Papier is the quiet ground, so the brief is not "less motion" — it is motion
 * that belongs to print rather than to a game console. Nothing glows, nothing
 * flashes, nothing overshoots for the sake of it. The three below disagree about
 * what a printed thing does when it arrives: it is set, it is turned, or it is
 * inked.
 *
 * The shell always renders the same hooks, so a variant animates whichever of
 * them it cares about:
 *
 *   .roll-out   the die's box — where it comes from, and its squash
 *   .roll-cube  the cube inside it, for the variants that turn one
 *   .fly        a die leaving the hand for the row
 *   .land       a die arriving in the row
 *   .draw       the Card arriving
 *   .jolt       the table between its two rules
 *   .sweep      a hairline that travels across the table
 *
 * The die's stagger comes off `--i`, its rough vector to the row off
 * `--dx`/`--dy`.
 *
 * No `.roll-cube` keyframe declares a `100%`, and that is load-bearing: the
 * animation interpolates into the die's own resting transform, so a tumble
 * cannot end on a face nobody rolled. `Die.tsx` carries the rest of it.
 */
export type Spec = {
  key: string;
  name: string;
  blurb: string;
  /** Whether the dice in hand are real cubes or flat printed squares. */
  cube: boolean;
  settleMs: number;
  drawMs: number;
  flyMs: number;
  css: string;
};

export const SPECS: Spec[] = [
  {
    key: "PA",
    name: "Satz",
    blurb: "Gesetzt. Der Würfel fällt, rollt aus und liegt.",
    cube: true,
    settleMs: 1000,
    drawMs: 620,
    flyMs: 440,
    css: `
/* Set, like type into a forme. The die is a real cube on the way down and a
   printed square the moment it lands.

   Weight, and it is measured now rather than described. The first pass had one
   bezier across the whole flight — cubic-bezier(0.3, 0.85, 0.3, 1) — which eases
   *out*, so the die decelerated on the way down and floated onto the table. A
   falling die accelerates. So the fall is sampled and the animation is linear: the
   curve is written down in the stops below where it can be read and changed one at
   a time, which is the arrangement the app's own dice already use.

   y follows -190% x (1 - (p/62)^2), which is constant acceleration to the table at
   62% of the flight. What comes after it is a bounce and a settle, and nothing of
   the fall is left in it.

   transform-origin: 50% 100% is what makes the squash an impact. Without it the die
   compressed about its own middle and read as a balloon being pumped — the bottom
   edge lifted off the table at the very moment it was supposed to be hitting it. */
.mv-PA .roll-out {
  transform-origin: 50% 100%;
  animation: PA-fall 620ms linear both;
  animation-delay: calc(var(--i) * 58ms);
}
@keyframes PA-fall {
  0%   { transform: translateY(-190%); opacity: 0 }
  8%   { transform: translateY(-187%); opacity: 1 }
  18%  { transform: translateY(-174%) }
  28%  { transform: translateY(-151%) }
  38%  { transform: translateY(-119%) }
  48%  { transform: translateY(-76%) }
  56%  { transform: translateY(-35%) }
  62%  { transform: translateY(0) scale(1) }
  /* The hit: it lands and gives. Widest and flattest a frame after contact. */
  67%  { transform: translateY(0) scaleX(1.17) scaleY(0.81) }
  72%  { transform: translateY(-9%) scaleX(0.97) scaleY(1.05) }
  /* One small second contact. A die does not bounce twice; this is the single hop
     a thrown cube has in it before it settles on a face. */
  78%  { transform: translateY(-13%) scale(1) }
  86%  { transform: translateY(0) scaleX(1.07) scaleY(0.94) }
  92%  { transform: translateY(0) scaleX(0.99) scaleY(1.02) }
  100% { transform: translateY(0) scale(1) }
}

/* The turns, read from --r0 to --r7 — computed in throw.ts from the very same
   restingRotation the element's own transform uses, because a keyframe cannot read
   a per-face resting rotation and the first pass's guess at it was the wobble at
   the end of the throw. Every stop says the same three turns in the same order as
   that transform, so the browser interpolates them one for one instead of
   decomposing matrices and taking its own way round.

   The stops run out at 62%, the impact. No 100%, so the last segment interpolates
   into the element's own resting rotation — which is what the last stop already is,
   so the die is still from the moment it touches. A die that goes on turning while
   it settles is a die nobody threw. */
.mv-PA .roll-cube {
  animation: PA-roll 620ms linear both;
  animation-delay: calc(var(--i) * 58ms);
}
@keyframes PA-roll {
  0%  { transform: var(--r0) }
  8%  { transform: var(--r1) }
  18% { transform: var(--r2) }
  28% { transform: var(--r3) }
  38% { transform: var(--r4) }
  48% { transform: var(--r5) }
  56% { transform: var(--r6) }
  62% { transform: var(--r7) }
}

/* The paper answers the weight on the frame the last die lands: five staggers of
   58ms, plus the 62% of 620ms that the fall itself takes. */
.mv-PA .jolt {
  animation: PA-jolt 260ms ease-out both;
  animation-delay: 674ms;
}
@keyframes PA-jolt {
  0%, 100% { transform: translateY(0) }
  30%  { transform: translateY(2px) }
  65%  { transform: translateY(-1px) }
}
/* Out of the hand on a heavy fall: fast away, no float. */
.mv-PA .fly {
  animation: PA-fly 440ms cubic-bezier(0.5, 0, 0.75, 0.4) both;
}
@keyframes PA-fly {
  0%   { transform: translate(0, 0) scale(1); opacity: 1 }
  65%  { opacity: 1 }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.34) rotate(72deg); opacity: 0 }
}
.mv-PA .land {
  animation: PA-land 300ms cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
@keyframes PA-land {
  0%   { transform: scale(1.45) }
  58%  { transform: scaleX(1.2) scaleY(0.84) }
  100% { transform: scale(1) }
}
/* The Card is dealt off the deck standing beside it: it comes across from the
   left, face-down, turns over on the way and is set down with the same squash the
   dice land with. The custom property --deal is how far it has to travel, which
   is the deck's own width plus the gap; the shell writes it down so the two
   cannot disagree. */
.mv-PA .draw {
  transform-origin: 50% 100%;
  animation: PA-draw 620ms cubic-bezier(0.25, 0.9, 0.3, 1) both;
  transform-style: preserve-3d;
}
@keyframes PA-draw {
  0%   { transform: translateX(calc(var(--deal) * -1)) rotate(-5deg) rotateY(180deg) scale(0.94) }
  46%  { transform: translateX(0) rotate(0deg) rotateY(180deg) scale(1) }
  47%  { transform: rotateY(180deg) }
  74%  { transform: rotateY(0deg) scale(1.02) }
  86%  { transform: rotateY(0deg) scaleX(1.03) scaleY(0.97) }
  100% { transform: rotateY(0deg) scale(1) }
}
`,
  },
  {
    key: "PB",
    name: "Umschlag",
    blurb: "Gewendet. Alles dreht sich um seine eigene Kante, wie eine Seite.",
    cube: false,
    settleMs: 800,
    drawMs: 520,
    flyMs: 360,
    css: `
/* Turned. Nothing here falls and nothing tumbles — every object pivots about one
   of its own edges, the way a page does. Flat dice throughout, one after the
   other, left to right, with a hairline running across the table ahead of them.
   The most printed of the three, and the only one with no third dimension in it
   beyond the hinge. */
.mv-PB .roll-out {
  animation: PB-turn 380ms cubic-bezier(0.42, 0, 0.22, 1) both;
  animation-delay: calc(var(--i) * 72ms);
  transform-origin: 0% 50%;
}
@keyframes PB-turn {
  0%   { transform: perspective(700px) rotateY(-104deg); opacity: 0 }
  36%  { opacity: 1 }
  74%  { transform: perspective(700px) rotateY(9deg) }
  100% { transform: perspective(700px) rotateY(0deg); opacity: 1 }
}
/* The hairline that runs ahead of the turning, once per throw. */
.mv-PB .sweep {
  animation: PB-sweep 620ms cubic-bezier(0.3, 0, 0.3, 1) both;
}
@keyframes PB-sweep {
  0%   { transform: scaleX(0); opacity: 0.9 }
  70%  { transform: scaleX(1); opacity: 0.9 }
  100% { transform: scaleX(1); opacity: 0 }
}
/* Out of the hand the same way it came in: turned away about its edge. */
.mv-PB .fly {
  transform-origin: 100% 50%;
  animation: PB-fly 360ms cubic-bezier(0.5, 0, 0.7, 0.5) both;
}
@keyframes PB-fly {
  0%   { transform: perspective(700px) translate(0, 0) rotateY(0deg); opacity: 1 }
  100% { transform: perspective(700px) translate(var(--dx), var(--dy)) rotateY(96deg) scale(0.4); opacity: 0 }
}
.mv-PB .land {
  transform-origin: 0% 50%;
  animation: PB-land 300ms cubic-bezier(0.35, 0, 0.2, 1) both;
}
@keyframes PB-land {
  0%   { transform: perspective(500px) rotateY(-96deg) }
  100% { transform: perspective(500px) rotateY(0deg) }
}
/* And the Card is a page as well, turned in off its left edge. */
.mv-PB .draw {
  transform-origin: 0% 50%;
  animation: PB-draw 520ms cubic-bezier(0.36, 0, 0.2, 1) both;
}
@keyframes PB-draw {
  0%   { transform: perspective(1400px) rotateY(-98deg); opacity: 0.2 }
  40%  { opacity: 1 }
  100% { transform: perspective(1400px) rotateY(0deg); opacity: 1 }
}
`,
  },
  {
    key: "PC",
    name: "Tinte",
    blurb: "Getuscht. Kommt aus dem Papier heraus und läuft aus.",
    cube: true,
    settleMs: 1150,
    drawMs: 820,
    flyMs: 560,
    css: `
/* Inked. Things do not arrive from anywhere — they come up out of the paper.
   Every entrance is a short drift out of a blur, slow, with the ink sharpening
   as it settles, and the Card is printed on rather than dealt: it is revealed
   left to right behind a wipe.
   The slowest of the three by a long way, and the bet it makes is that a quiet
   ground can afford it. Judge that against how often you roll. */
.mv-PC .roll-out {
  animation: PC-ink 780ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 92ms);
}
@keyframes PC-ink {
  0%   { transform: translateY(22px) scale(0.9) rotate(5deg); opacity: 0; filter: blur(7px) }
  40%  { opacity: 1 }
  100% { transform: none; opacity: 1; filter: blur(0) }
}
/* A single lazy quarter-turn under the blur, so the face resolves rather than
   being switched. Ends nowhere on purpose — the die's own resting rotation is
   the landing. */
.mv-PC .roll-cube {
  animation: PC-turn 780ms cubic-bezier(0.2, 0.9, 0.25, 1) both;
  animation-delay: calc(var(--i) * 92ms);
}
@keyframes PC-turn {
  0%  { transform: rotateX(-196deg) rotateY(-124deg) }
  72% { transform: rotateX(14deg) rotateY(10deg) }
}
/* Away on a long arc, blurring back out as it goes. */
.mv-PC .fly {
  animation: PC-fly 560ms cubic-bezier(0.35, 0.05, 0.4, 1) both;
}
@keyframes PC-fly {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; filter: blur(0) }
  45%  { transform: translate(calc(var(--dx) * 0.5), calc(var(--dy) * -0.18)) scale(0.82); opacity: 0.9; filter: blur(1px) }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.32); opacity: 0; filter: blur(5px) }
}
.mv-PC .land {
  animation: PC-land 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes PC-land {
  0%   { transform: scale(0.6); opacity: 0; filter: blur(4px) }
  100% { transform: scale(1); opacity: 1; filter: blur(0) }
}
/* Printed on: a wipe left to right, with the Card drifting the last few pixels
   up under it. */
.mv-PC .draw {
  animation: PC-print 820ms cubic-bezier(0.22, 1, 0.3, 1) both;
}
@keyframes PC-print {
  0%   { clip-path: inset(0 100% 0 0); transform: translateY(10px) }
  70%  { clip-path: inset(0 0 0 0) }
  100% { clip-path: inset(0 0 0 0); transform: none }
}
`,
  },
];
