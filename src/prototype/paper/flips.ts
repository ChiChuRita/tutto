/**
 * PROTOTYPE — throwaway. Three ways to turn a Card over.
 *
 * The ground is Papier, the motion is Satz, the Card is Gestochen in Farbe. What
 * is open is the deal, and the real question in it is not how fast the Card spins
 * — it is **when the Player finds out what they drew**. The deal has two acts, the
 * travel from the deck to the slot and the turn, and the three variants order
 * those acts the three ways they can be ordered:
 *
 *   FA  turned on the deck, then slid across face-up — you know before it lands
 *   FB  turned in the air, halfway across    — the reveal is the movement itself
 *   FC  slid across face-down, then opened in the slot — you know last
 *
 * That ordering is worth more than the easing, because a drawn Card is news: it
 * decides whether the Turn can go on. The real screen already delays the sentence
 * under the pile until the flip has happened for exactly that reason (`Game.tsx`
 * on `explained`), so wherever the reveal lands here, the words follow it.
 *
 * FC also turns on the other axis, which is the second thing to judge: a Card
 * hinging up off its bottom edge in the slot reads as a card being turned face-up
 * on a table, and one spinning about its middle reads as a card being dealt.
 *
 * Each spec owns the whole `.flip` animation — travel and turn together, because
 * they are one gesture — and replaces Satz's own `.draw`. `--deal` is how far the
 * slot is from the deck; the shell writes it down.
 */
export type Flip = {
  key: string;
  name: string;
  blurb: string;
  /** Which axis the Card turns about, so its back can be mounted to match. */
  axis: "x" | "y";
  /** How long the whole deal takes, for the gate that holds the deck. */
  ms: number;
  css: string;
};

export const FLIPS: Flip[] = [
  {
    key: "FA",
    name: "Am Stapel",
    blurb:
      "Die Karte dreht sich auf dem Stapel um und kommt offen herüber. Du weißt es zuerst.",
    axis: "y",
    ms: 820,
    css: `
/* Turned where it was lying, then dealt. The Card spends the first third of the
   deal standing on the deck turning over, and the rest sliding into the slot with
   its face already up — so the news arrives before the movement is finished and
   the slide is only tidying up. */
.fl-FA .flip {
  transform-origin: 50% 50%;
  animation: FA-deal 820ms both;
  animation-timing-function: cubic-bezier(0.3, 0.85, 0.3, 1);
}
@keyframes FA-deal {
  0%   { transform: translateX(calc(var(--deal) * -1)) rotateY(180deg) }
  8%   { transform: translateX(calc(var(--deal) * -1)) rotateY(180deg) }
  40%  { transform: translateX(calc(var(--deal) * -1)) rotateY(0deg) }
  48%  { transform: translateX(calc(var(--deal) * -1)) translateY(-5px) scale(1.02) }
  84%  { transform: translateX(0) translateY(-2px) scale(1.01) }
  92%  { transform: translateX(0) scaleX(1.03) scaleY(0.97) }
  100% { transform: translateX(0) scale(1) }
}
`,
  },
  {
    key: "FB",
    name: "Im Flug",
    blurb:
      "Die Karte dreht sich unterwegs um, auf halber Strecke. Die Bewegung ist die Enthüllung.",
    axis: "y",
    ms: 700,
    css: `
/* Turned in the air. One gesture and no seam in it: the Card lifts off the deck,
   comes over edge-on at the halfway mark and is face-up by the time it sets down.
   The shortest of the three, and the only one where you cannot separate the
   travel from the reveal. */
.fl-FB .flip {
  transform-origin: 50% 50%;
  animation: FB-deal 700ms cubic-bezier(0.32, 0.72, 0.28, 1) both;
}
@keyframes FB-deal {
  0%   { transform: translateX(calc(var(--deal) * -1)) rotateY(180deg) rotate(-4deg) scale(0.94) }
  50%  { transform: translateX(calc(var(--deal) * -0.42)) translateY(-12px) rotateY(90deg) rotate(-1deg) scale(1.06) }
  82%  { transform: translateX(0) rotateY(6deg) rotate(0deg) scale(1.01) }
  92%  { transform: translateX(0) rotateY(0deg) scaleX(1.03) scaleY(0.97) }
  100% { transform: translateX(0) rotateY(0deg) scale(1) }
}
`,
  },
  {
    key: "FC",
    name: "Aufgeschlagen",
    blurb:
      "Die Karte liegt verdeckt auf dem Stapel und wird an ihrer Kante ins Fach umgeschlagen. Du weißt es zuletzt.",
    axis: "y",
    ms: 900,
    css: `
/* Turned over off its own edge, and so it never travels at all: the Card starts
   face-down where the deck is standing, holds there for a beat, and the turn is
   what carries it into the slot. Which is what a hand does — a card is not slid
   across a table and then flipped, it is turned over off the pile into place.
   The hinge is the slot's left edge, so at the start the Card lies exactly on the
   deck and at the end it is exactly in the slot. Nothing has to reserve room for
   it: it sweeps through the space the deck already occupies rather than out over
   the page. The first pass hinged it off the bottom edge instead, which put the
   Card up above the row for a third of a second — off the top of the screen,
   because this row is the top of the screen.
   The longest of the three, and the only one with a pause in it. The pause is the
   point: it is the moment before you know. */
.fl-FC .flip {
  transform-origin: 0% 50%;
  animation: FC-deal 900ms linear both;
}

/* Sampled, and driven by \`linear\` — the same arrangement the dice use, and for
   the same reason: the curve is then written down here where it can be read and
   changed a stop at a time, instead of being the output of a bezier nobody can
   picture. The first pass used cubic-bezier(0.34, 0.8, 0.3, 1) across the whole
   turn, which is heavily front-loaded: measured frame by frame, the Card was
   face-up by 40% of the deal and the remaining 500ms were dead. Every stop below
   was set by looking at that filmstrip.

   **The rotation is negative, and that is the whole difference between this
   reading right and reading wrong.** It was +180deg to 0, and the report on it was
   that the Card seemed to come from behind — which it did, and the arithmetic says
   so. CSS \`rotateY(t)\` sends a point at x=d to z' = -d·sin(t). Going from +180deg
   down to +90deg, sin climbs from 0 to 1, so the Card's free edge travels to
   z = -d: away from the viewer, behind the page, for the whole first half of the
   turn. It then came back out of it, which is exactly what »von hinten« looks
   like. From -180deg the same sweep puts the free edge at z = +d instead — the
   Card lifts off the pile *toward* the Player, stands up, and lays itself down
   into the slot. Same start, same end, same duration; only the way round.

   Four acts:
     0–14%    the beat. The Card lies face-down on the deck, indistinguishable
              from the deck's own top card, and nothing moves. This is the moment
              before you know, and it is the whole reason this deal was chosen.
     14–52%   the lift. Slow off the hinge, accelerating, and coming toward the
              Player — a card being turned is heaviest at the start, when it is
              still flat on the pile.
     52–80%   the fall. It goes over the top and comes down into the slot.
     80–100%  the settle, through a 6deg overshoot. Small: a card has no bounce in
              it, and this is the paper flexing, not the card leaving the table.

   The -8px is the gap between the two piles, which the hinge alone cannot account
   for: mirrored about the slot's left edge the Card lands one card-width to the
   left, and the deck is one card-width *and the gap* away. It resolves between
   20% and 60%, while the Card is near edge-on and the shift cannot be seen.

   The z lift is the second half of the answer to »von hinten«. Turning the right
   way round is what stops the Card going behind the page; coming 26px out of it at
   the top of the turn is what makes it read as *lifted* rather than merely
   rotated. It is in \`translate3d\` so it is a move in the page's space rather than
   the Card's, which means it magnifies the whole Card evenly instead of shearing
   it. The Y lift of 4px stays, and is what stops the turn reading as a card
   sliding under itself. */
@keyframes FC-deal {
  0%   { transform: translate3d(-8px, 0, 0) rotateY(-180deg) }
  14%  { transform: translate3d(-8px, 0, 0) rotateY(-180deg) }
  20%  { transform: translate3d(-8px, -1px, 4px) rotateY(-176deg) }
  28%  { transform: translate3d(-6px, -2px, 12px) rotateY(-163deg) }
  36%  { transform: translate3d(-5px, -3px, 20px) rotateY(-143deg) }
  44%  { transform: translate3d(-3px, -4px, 25px) rotateY(-117deg) }
  52%  { transform: translate3d(-2px, -4px, 26px) rotateY(-88deg) }
  60%  { transform: translate3d(0, -3px, 22px) rotateY(-60deg) }
  68%  { transform: translate3d(0, -2px, 15px) rotateY(-36deg) }
  74%  { transform: translate3d(0, -1px, 9px) rotateY(-20deg) }
  80%  { transform: translate3d(0, 0, 4px) rotateY(-7deg) }
  86%  { transform: translate3d(0, 0, 0) rotateY(4deg) }
  92%  { transform: translate3d(0, 0, 0) rotateY(6deg) }
  96%  { transform: translate3d(0, 0, 0) rotateY(3deg) }
  100% { transform: translate3d(0, 0, 0) rotateY(0deg) }
}
`,
  },
];
