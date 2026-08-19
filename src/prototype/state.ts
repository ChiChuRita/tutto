/**
 * PROTOTYPE — throwaway. One frozen mid-Turn position, so all three variants
 * are judged on the same table: a Roll of six is down, four dice are already
 * herausgelegt, a Bonus 400 is in force, three Seats on the board.
 */
export const POSITION = {
  wager: 1250,
  deckLeft: 41,
  card: {
    name: "Bonus 400",
    effect: "400 Punkte extra, wenn du TUTTO schaffst.",
  },
  beneath: { name: "×2", colour: "cobalt" as const },
  seats: [
    { name: "Anna", score: 3200, turn: true },
    { name: "Ben", score: 2450, turn: false },
    { name: "Clara", score: 900, turn: false },
  ],
  news: "Zwei Fünfen und eine Eins liegen bereit.",
  roll: [5, 1, 3, 5, 2, 4] as const,
  setAside: [5, 5, 1, 1] as const,
  gain: 150,
};
