/**
 * PROTOTYPE — throwaway. Restyle variants for the play screen, switchable via
 * `?prototype=` on the app's own URL, so each one is judged inside the real page
 * margins and the real `--room` height budget.
 *
 * Round one asked what the table should look like, and the answer is **Papier**.
 * Round two asked what it should *move* like: **Satz**. Round three asked how the
 * Cards should be printed on it: **Gestochen in Farbe**, which is Gestochen's
 * drawing on Farbfeld's ground. So round four is the deal — `FA`, `FB` and `FC` in
 * `paper/flips.ts`, three answers to when the Player finds out what they drew.
 *
 * Everything else here is the record of how the decisions were reached, kept
 * reachable rather than deleted:
 *
 *   ?prototype=CD|CA|CB|CC  the four card treatments of round three
 *   ?prototype=CS           all eleven Cards, in every treatment
 *   ?prototype=PA|PB|PC  the three motion languages of round two
 *   ?prototype=B         Papier at rest, the still drawing that won round one
 *   ?prototype=A         Nachttisch, the ground that lost it
 *   ?prototype=MA|MB|MC  the same three motion languages on Arcade, built when
 *                        Arcade was briefly the answer
 *
 * Not production code: no data, no mutations, no tests, inline styles throughout
 * so nothing here can leak into `index.css`.
 */
import { Switcher } from "./Switcher";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { ArcadeShell } from "./arcade/Shell";
import { SPECS as ARCADE } from "./arcade/spec";
import { PaperShell } from "./paper/Shell";
import { SPECS } from "./paper/spec";
import { CARD_STYLES, type CardStyle } from "./paper/cardStyles";
import { PaperSheet } from "./paper/Sheet";
import { FLIPS } from "./paper/flips";
import { PaperStrip } from "./paper/Strip";
import { PaperDieStrip } from "./paper/DieStrip";
import { RealTable } from "./RealTable";

/** The motion that won round two, and so the one every later variant is shown in. */
const SATZ = SPECS[0];
/** And the Card that won round three, which every deal is dealt with. */
const KARTE = "CD" satisfies CardStyle;

const NAMES: Record<string, string> = {
  ...Object.fromEntries(FLIPS.map((flip) => [flip.key, flip.name])),
  ...Object.fromEntries(
    CARD_STYLES.map((style) => [style.key, `Karte/${style.name}`]),
  ),
  CS: "Alle Karten",
  DS: "Wurf, Bild für Bild",
  REAL: "Echte Bauteile auf dem neuen Grund",
  ...Object.fromEntries(
    FLIPS.map((flip) => [`${flip.key}S`, `${flip.name}, Bild für Bild`]),
  ),
  ...Object.fromEntries(
    SPECS.map((spec) => [spec.key, `Bewegung/${spec.name}`]),
  ),
  ...Object.fromEntries(
    ARCADE.map((spec) => [spec.key, `Arcade/${spec.name}`]),
  ),
  A: "Nachttisch (verworfen)",
  B: "Papier, ruhend",
};

export function PrototypeTable({
  variant,
  onChange,
}: {
  variant: string;
  onChange: (key: string) => void;
}) {
  const key = variant in NAMES ? variant : FLIPS[0].key;
  const flip = FLIPS.find((candidate) => candidate.key === key);
  const style = CARD_STYLES.find((candidate) => candidate.key === key);
  const spec = SPECS.find((candidate) => candidate.key === key);
  const arcade = ARCADE.find((candidate) => candidate.key === key);
  return (
    <>
      {/* The deal, which is the open question. */}
      {flip !== undefined && (
        <PaperShell key={flip.key} spec={SATZ} cardStyle={KARTE} flip={flip} />
      )}
      {/* The card treatments, all in Satz. */}
      {style !== undefined && (
        <PaperShell key={style.key} spec={SATZ} cardStyle={style.key} />
      )}
      {/* And the motion round, kept reachable, drawn in the first treatment. */}
      {spec !== undefined && (
        <PaperShell key={spec.key} spec={spec} cardStyle={KARTE} />
      )}
      {key === "CS" && <PaperSheet />}
      {key === "DS" && <PaperDieStrip specKey={SATZ.key} />}
      {key === "REAL" && <RealTable />}
      {/* The filmstrips: `?prototype=FCS` for Aufgeschlagen, frame by frame. */}
      {key.endsWith("S") && FLIPS.some((f) => `${f.key}S` === key) && (
        <PaperStrip flipKey={key.slice(0, -1)} />
      )}
      {arcade !== undefined && <ArcadeShell key={arcade.key} spec={arcade} />}
      {key === "A" && <VariantA />}
      {key === "B" && <VariantB />}
      <Switcher
        keys={FLIPS.map((candidate) => candidate.key)}
        names={NAMES}
        current={key}
        onChange={onChange}
      />
    </>
  );
}
