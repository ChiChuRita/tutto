/**
 * PROTOTYPE — throwaway. The three card treatments, named. Its own file so the
 * card drawings stay a module of components only, which is what keeps fast
 * refresh working on the file being iterated on hardest.
 */
export type CardStyle = "CA" | "CB" | "CC" | "CD";

export const CARD_STYLES: { key: CardStyle; name: string; blurb: string }[] = [
  {
    key: "CD",
    name: "Gestochen in Farbe",
    blurb:
      "Die Zeichnung von Gestochen auf dem Grund von Farbfeld, in den Farben des Regelhefts.",
  },
  {
    key: "CA",
    name: "Gestochen",
    blurb:
      "Die Karte ist Papier. Die Farbe der Karte steckt nur in der Zeichnung.",
  },
  {
    key: "CB",
    name: "Banderole",
    blurb: "Die Karte trägt ihren Namen auf einem farbigen Band.",
  },
  {
    key: "CC",
    name: "Farbfeld",
    blurb:
      "Die Karte ist ganz in ihrer Farbe getönt — am nächsten am Original.",
  },
];
