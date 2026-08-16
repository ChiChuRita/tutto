import type { Turn, TurnPhase } from "./game/turn";

/**
 * The one thing the play screen's message line has to say about a Turn, or
 * nothing. One string, never two, because the line holds a fixed height and a
 * second sentence would push the dice and the buttons down — which is the whole
 * point of reserving it.
 *
 * More than one of these can be true at the same time, which is why this is a
 * function and not four conditions in the markup. A Turn that has ended says so
 * and nothing else, so the phase decides first and `tutto` only speaks where
 * the Turn is still running.
 *
 * Keyed by phase for the same reason `cards.ts` is keyed by Card: a phase added
 * to the reducer is a compile error here rather than something that quietly
 * inherits a line written for another phase. A terminal phase falling through
 * to "alle sechs Würfel zurück" would promise six dice that are not coming.
 */
const LINE: Record<TurnPhase, (turn: Turn) => string | null> = {
  null: (turn) =>
    // A Feuerwerk can only end on a Niete, and pays out all the same.
    turn.card === "fireworks"
      ? `Niete! Feuerwerk vorbei, ${turn.score} Punkte gesichert.`
      : "Niete! Alle Punkte aus diesem Zug sind weg.",
  stopCard: () => "Stop-Karte! Der Zug ist vorbei, keine Punkte.",
  // Plus/Minus is the case where a Tutto and a finished Turn are both true: the
  // Card banks its flat 1000 on the Tutto and ends the Turn in the same move.
  // Both facts go in one line, and it does not promise six dice back — the Turn
  // is over and they are not coming.
  stopped: (turn) =>
    turn.tutto
      ? `TUTTO! Zug beendet, ${turn.score} Punkte gesichert.`
      : `Zug beendet. ${turn.score} Punkte gesichert.`,
  // A Kleeblatt won the Game outright. The Result screen is what says so, and
  // this line is never on screen — but it is named rather than defaulted.
  won: () => null,
  // Still running: the only news is a Tutto handing the six dice back.
  awaitingCard: (turn) => tuttoLine(turn),
  awaitingRoll: (turn) => tuttoLine(turn),
  awaitingSetAside: (turn) => tuttoLine(turn),
};

const tuttoLine = (turn: Turn): string | null =>
  turn.tutto ? "TUTTO! Alle sechs Würfel zurück." : null;

export const turnMessage = (turn: Turn): string | null =>
  LINE[turn.phase](turn);
