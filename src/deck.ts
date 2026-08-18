import { seatMayPlay, seatMayTakeOver, type GameState } from "./game/turn";

/**
 * What tapping the deck does right now, or `null` for a deck that is not this
 * device's to tap. The deck is the draw — the Card comes off it and there is no
 * button anywhere else that draws one — so this is the whole of a move and not
 * a label for one.
 *
 * Two strings, because the move is said twice and has to say the same thing
 * both times: `action` names the deck for a reader that cannot see it, and
 * `prompt` stands in the slot the button used to, where a Player who can see
 * the deck learns that it is now the thing to reach for. One function decides
 * both, so they cannot come apart.
 *
 * The strings live here and not in the markup for the reason `message.ts`'s do:
 * more than one of these positions is nearly true at once — a Turn that is over
 * for the Seat that played it and a draw for the Seat up next are the same
 * position read from two devices — and choosing between them is the thing worth
 * testing.
 */
export type DeckMove = {
  /** What tapping the deck does, said in the deck's accessible name. */
  action: string;
  /** The same move said out loud, under the table where the button was. */
  prompt: string;
  /**
   * Tapping puts the Turn's winnings back on the table. Only »weitermachen«
   * does, and the screen says so in colour rather than in more words: the slot
   * this line stands in is 44px on the shortest phone the screen is built for,
   * which is two lines of the quiet type. The sentence is written to fit in
   * them, and it sits directly above »aufhören«, where the two halves are read
   * as one decision anyway.
   */
  risky: boolean;
};

/** The start of a Turn, and the Seat up next on a Turn that is over. */
const DRAW: DeckMove = {
  action: "Karte ziehen",
  prompt: "Zieh oben eine Karte vom Stapel.",
  risky: false,
};

/**
 * After a TUTTO the deck is no longer a step, it is half a decision: rolling on
 * costs a new Card, and the Turn's winnings go back on the table to pay for it.
 * »aufhören« is the other half, sitting directly under this line, so the two are
 * read together — and this half is the one that has to say what it costs, since
 * banking says nothing about what banking saves you from.
 *
 * The number is said rather than implied. »Im Zug« carries the same figure at
 * the top of the screen, but that is what the Turn is worth; this is what the
 * tap risks, and a Player deciding needs it in the sentence they are deciding
 * from.
 */
const risking = (score: number): DeckMove => ({
  action: `weitermachen — neue Karte ziehen und ${score} Punkte riskieren`,
  prompt: `Weitermachen? Zieh oben eine Karte — und riskier die ${score} Punkte.`,
  risky: true,
});

/**
 * Whose deck it is, and for what.
 *
 * Two positions, and the split is the play screen's own: whose Turn it is comes
 * off the live position, because that is a rule and not news, while what the
 * Turn is waiting for comes off the settled one, so a move never appears on a
 * screen still showing the dice that made it. The Seat up next is settled for
 * the same reason and a sharper one — the live position knows a Turn ended on a
 * Niete while the dice saying so are still turning, and a deck lighting up
 * there would announce the outcome before the table did.
 */
export function deckMove(
  live: GameState,
  said: GameState | null,
  seat: number | null,
): DeckMove | null {
  if (seat === null || said === null) return null;
  if (seatMayPlay(live, seat) && said.turn.phase === "awaitingCard") {
    return said.turn.tutto ? risking(said.turn.score) : DRAW;
  }
  // The Seat up next may draw without waiting for whoever just finished to
  // clear the table, which is the whole of `seatMayTakeOver`.
  if (seatMayTakeOver(said, seat)) return DRAW;
  return null;
}

/**
 * The deck's accessible name: what tapping it does, and how many Cards are
 * left. Both, because a name replaces the text inside the element rather than
 * joining it, and the count printed on the deck is information a Player uses —
 * counting Cards is part of playing Tutto well, and it is not a sighted
 * Player's alone.
 *
 * A deck with no move still gets named for what it is. It is inert, not absent.
 */
export const deckLabel = (move: DeckMove | null, left: number): string =>
  `${move === null ? "Kartenstapel" : move.action}, ${
    left === 1 ? "noch 1 Karte" : `noch ${left} Karten`
  }`;
