import type { Turn } from "./game/turn";

/**
 * The one thing the play screen's message line has to say about a Turn, or
 * nothing. One string, never two, because the line holds a fixed height and a
 * second sentence would push the dice and the buttons down — which is the whole
 * point of reserving it.
 *
 * More than one of these can be true at the same time, which is why this is a
 * function and not four conditions in the markup. A Turn that has ended says so
 * and nothing else, so the phase is asked first and `tutto` only speaks when
 * the Turn is still running.
 */
export function turnMessage(turn: Turn): string | null {
  switch (turn.phase) {
    case "null":
      // A Feuerwerk can only end on a Niete, and pays out all the same.
      return turn.card === "fireworks"
        ? `Niete! Feuerwerk vorbei, ${turn.score} Punkte gesichert.`
        : "Niete! Alle Punkte aus diesem Zug sind weg.";
    case "stopCard":
      return "Stop-Karte! Der Zug ist vorbei, keine Punkte.";
    case "stopped":
      // Plus/Minus is the case where a Tutto and a finished Turn are both true:
      // the Card banks its flat 1000 on the Tutto and ends the Turn in the same
      // move. Both facts go in one line, and it does not promise six dice back —
      // the Turn is over and they are not coming.
      return turn.tutto
        ? `TUTTO! Zug beendet, ${turn.score} Punkte gesichert.`
        : `Zug beendet. ${turn.score} Punkte gesichert.`;
    default:
      return turn.tutto ? "TUTTO! Alle sechs Würfel zurück." : null;
  }
}
