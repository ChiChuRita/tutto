/**
 * PROTOTYPE — throwaway. The Papier table, driveable.
 *
 * The ground is settled — Papier won — so the skin is fixed here and the only
 * thing that changes between variants is how it moves. Everything is replayable:
 * »würfeln« throws the dice in hand, tapping dice and »herauslegen« sends them to
 * the row, and the deck line draws a Card. Nothing is persisted and nothing talks
 * to a server; faces are drawn locally so a roll can be replayed for as long as
 * it takes to judge it.
 *
 * Not production code. The real thing measures the row's berth before a die
 * flies (as `Game.tsx` already does) and gates every animation on
 * `useReducedMotion`; both are faked here and marked where.
 */
import { memo, useEffect, useState } from "react";
import type { Face } from "../../game/turn";
import { ALL_FACES } from "../../dice";
import { PaperDie } from "./Die";
import type { Spec } from "./spec";
import { PaperCardBack, PaperCardFlip } from "./CardFace";
import type { CardStyle } from "./cardStyles";
import type { Flip } from "./flips";
import { rollPath } from "./throw";
import { cardFace } from "../../cards";
import type { Card } from "../../game/turn";

const PAPER = "#f6f3ec";
const INK = "#1c1b19";
const RULE = "#d9d3c6";
const CLAY = "#b4552d";
const QUIET = "#7c7669";

/**
 * One of each mark, in the order that shows them off: a Bonus numeral, the
 * multiplier, then the five drawn Forcing faces. Real Cards and the rulebook's
 * own effect lines — `cards.ts` is the source, so nothing about a Card is
 * invented here and the wording on screen is the wording the game ships.
 */
const CARDS: Card[] = [
  "bonus400",
  "x2",
  "stop",
  "fireworks",
  "straight",
  "plusMinus",
  "cloverleaf",
];

const SEATS = [
  { name: "Anna", score: 3200, turn: true },
  { name: "Ben", score: 2450, turn: false },
  { name: "Clara", score: 900, turn: false },
];

const throwSix = () =>
  Array.from({ length: 6 }, () => ALL_FACES[Math.floor(Math.random() * 6)]);

/**
 * Roughly where the row is, from a die's place in the hand — the vector `.fly`
 * carries it along. Approximated from the layout rather than measured, which is
 * the one honest shortcut in here: the real screen measures the berth in the tap
 * itself, and this only has to be close enough to read as "over there".
 */
const vector = (index: number, slot: number) => {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    "--dx": `${74 + slot * 30 - (68 + column * 114)}px`,
    "--dy": `${252 - (110 + row * 84)}px`,
  } as React.CSSProperties;
};

/**
 * The variant's stylesheet, and it is `memo`'d for a reason that took a filmstrip
 * to find.
 *
 * Rendering `<style>{css}</style>` inline looks harmless — the string never
 * changes — but React re-renders this component every time the deal lands
 * (`dealt`, `revealed`) and a re-inserted stylesheet restarts every animation
 * running off it. What that looked like on screen was the Card turning over,
 * landing, and then jumping back onto the deck to deal itself a second time.
 *
 * `memo` on a component whose only prop is the css string means React never
 * touches the node after the first render, so nothing can restart. The real screen
 * has no equivalent hazard because its animations live in `index.css`, which is
 * loaded once and never re-inserted — this is a cost of keeping a prototype's
 * three motion languages in three strings.
 */
const Sheet = memo(function Sheet({ css }: { css: string }) {
  return <style>{css}</style>;
});

export function PaperShell({
  spec,
  cardStyle,
  flip = null,
}: {
  spec: Spec;
  cardStyle: CardStyle;
  /**
   * The deal, when one is being judged. It owns the whole gesture — travel and
   * turn — so it replaces the motion language's own `.draw` rather than layering
   * on top of it, and the Card wears `.flip` instead.
   */
  flip?: Flip | null;
}) {
  // A fresh key on every throw is what restarts the CSS animation — the same
  // mechanism the real screen uses, where the Roll itself is the key.
  const [rollId, setRollId] = useState(1);
  const [faces, setFaces] = useState<Face[]>(throwSix);
  const [gone, setGone] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [flying, setFlying] = useState<number[]>([]);
  const [aside, setAside] = useState<Face[]>([]);
  const [landing, setLanding] = useState(0);
  const [cardId, setCardId] = useState(1);
  const [card, setCard] = useState(0);

  // Nothing may be tapped while the dice are still in the air. `settled` is the
  // roll this screen has already watched land, so `busy` is derived rather than
  // stored — the real screen asks `useSettled` the same question.
  const [settled, setSettled] = useState(0);
  const busy = settled !== rollId;

  useEffect(() => {
    const id = setTimeout(() => setSettled(rollId), spec.settleMs);
    return () => clearTimeout(id);
  }, [rollId, spec]);

  const inHand = faces
    .map((_, index) => index)
    .filter((index) => !gone.includes(index));

  const newTurn = () => {
    setFaces(throwSix());
    setGone([]);
    setAside([]);
    setChosen([]);
    setLanding(0);
    setRollId((n) => n + 1);
  };

  const rollOn = () => {
    setFaces((now) =>
      now.map((face, index) =>
        gone.includes(index) ? face : ALL_FACES[Math.floor(Math.random() * 6)],
      ),
    );
    setChosen([]);
    setRollId((n) => n + 1);
  };

  const commit = () => {
    if (chosen.length === 0) return;
    const taken = chosen.map((index) => faces[index]);
    setFlying(chosen);
    setTimeout(() => {
      setAside((now) => [...now, ...taken]);
      setLanding(taken.length);
      setGone((now) => [...now, ...chosen]);
      setFlying([]);
      setChosen([]);
    }, spec.flyMs);
  };

  // Which deal this screen has already watched land, so `dealing` is derived the
  // same way `busy` is rather than being a second flag to keep in step.
  const [dealt, setDealt] = useState(0);
  const dealing = dealt !== cardId;
  /**
   * The Card the screen is allowed to *talk* about, which is not the Card it is
   * drawing. You learn what you drew by watching it turn over, so the sentence
   * beside it has to wait for the turn — printing the effect the moment the deck
   * is tapped spells the Card out in plain German before the flip that was
   * supposed to reveal it, and under Aufgeschlagen that is 600ms early.
   *
   * The real screen has exactly this rule and solves it the same way: the sentence
   * under the pile is the *settled* Turn's Card, one draw behind the live one
   * (`Game.tsx` on `explained`). `null` until the very first Card has landed,
   * because before that there is genuinely nothing to say.
   */
  const [revealed, setRevealed] = useState<number | null>(null);

  useEffect(() => {
    const ms = flip?.ms ?? spec.drawMs;
    const id = setTimeout(() => {
      setDealt(cardId);
      setRevealed(card);
    }, ms);
    return () => clearTimeout(id);
  }, [cardId, card, flip, spec]);

  const draw = () => {
    setCard((n) => (n + 1) % CARDS.length);
    setCardId((n) => n + 1);
  };

  const toggle = (index: number) => {
    if (busy || flying.length > 0) return;
    setChosen((now) =>
      now.includes(index)
        ? now.filter((other) => other !== index)
        : [...now, index],
    );
  };

  const drawn = CARDS[card];
  const wager = 1250 + aside.length * 50;

  return (
    <div
      className={
        flip === null ? `mv-${spec.key}` : `mv-${spec.key} fl-${flip.key}`
      }
      style={{
        background: PAPER,
        color: INK,
        padding: "calc(var(--play-pad) + 6px)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        gap: "calc(var(--play-gap) + 4px)",
        fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
      }}
    >
      {/* Scoped to the wrapper class, so three motion languages and three deals
          can define the same hook names without colliding. */}
      <Sheet css={spec.css} />
      {flip !== null && <Sheet css={flip.css} />}

      {/* The two piles, as the real screen has them: the deck, and beside it the
          slot the Card lands in. The deck is the draw — the whole card is the
          button, so the move is made on the object it comes off rather than on a
          line of type somewhere else. It is a real `<button>` for the reasons
          `Card.tsx` gives: keyboard-reachable, focus-ringed, and switched off by
          `disabled` when there is no move.
          The wager keeps the right-hand column, which is where Papier had it. */}
      {/* 16 and not 10 above the cards: at the edge-on moment the turning Card's
          leading edge is nearest the Player and so drawn largest, and it was
          coming up through the rule for a few frames. The room is cheaper than
          the artefact — this column has room to spare, and the play screen's own fold
          is measured with the dice never giving anything. */}
      <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <PaperCardBack
            left={41 - cardId}
            // While a deal is running the deck is not a move: a second Card
            // cannot come off it until the first one is lying face-up.
            disabled={busy || dealing}
            onDraw={draw}
          />
          {/* How far the deal travels: the deck's own width and the gap between
              them, so the Card starts exactly where the deck is standing. */}
          {/* The hinge's depth sits on the parent of the thing that turns: a
              `perspective` on the turning element itself does nothing for its
              own rotation. */}
          {/* Both boxes are pinned to the Card's width, and that is not tidiness:
              Aufgeschlagen hinges on `transform-origin: 0%`, which is the *box's*
              left edge. If either of these were wider than the Card, the hinge
              would be somewhere out in the gap and the turn would swing from
              nothing. */}
          <div
            style={{
              perspective: "44rem",
              width: "var(--card-width)",
              flex: "none",
            }}
          >
            <div
              key={`card-${cardId}`}
              className={flip === null ? "draw" : "flip"}
              style={{
                ["--deal" as string]: "calc(var(--card-width) + 8px)",
                width: "var(--card-width)",
                // Set here and not in the animations, because a spec that forgets
                // it does not fail loudly: the element flattens, the back face
                // collapses onto the front, and the turn shows the Card mirrored
                // instead of face-down. It is the one property every deal needs
                // and none of them is about.
                transformStyle: "preserve-3d",
              }}
            >
              <PaperCardFlip
                card={drawn}
                style={cardStyle}
                backAxis={flip?.axis ?? "y"}
              />
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: QUIET,
              }}
            >
              im Zug
            </span>
            <span
              style={{
                fontSize: 34,
                lineHeight: 0.95,
                color: CLAY,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {wager.toLocaleString("de-DE")}
            </span>
            {/* What the Card does, in the rulebook's own German. The card above
                says which Card it is; this says what it costs you — and it says it
                only once the Card is face-up. Two lines of room are held whatever
                is in it, so the reveal does not shove the table. */}
            <p
              style={{
                marginTop: 4,
                minHeight: "2.7em",
                fontSize: 11,
                lineHeight: 1.35,
                color: QUIET,
                textAlign: "right",
              }}
            >
              {revealed === null ? "" : cardFace(CARDS[revealed]).effect}
            </p>
          </div>
        </div>
      </div>

      {/* The Seats as one ranked line of type. No chips, no tiles, no bars. */}
      <ol
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          fontSize: 14,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {SEATS.map((seat, rank) => (
          <li
            key={seat.name}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              fontWeight: seat.turn ? 700 : 400,
              color: seat.turn ? INK : QUIET,
            }}
          >
            <span style={{ width: "1.2em", color: QUIET, fontSize: 11 }}>
              {rank + 1}
            </span>
            <span style={{ flex: 1 }}>
              {seat.name}
              {seat.turn && <span style={{ color: CLAY }}> ·</span>}
            </span>
            <span>{seat.score.toLocaleString("de-DE")}</span>
          </li>
        ))}
      </ol>

      {/* The table: no fill, no border, no radius. Two rules and the air between
          them, which is what a printed block is. */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          key={`table-${rollId}`}
          className="jolt"
          style={{
            borderTop: `1px solid ${RULE}`,
            borderBottom: `1px solid ${RULE}`,
            padding: "16px 0",
            position: "relative",
          }}
        >
          {/* The hairline a language may run across the table. Scaled from the
              left, so it draws itself. */}
          <span
            key={`sweep-${rollId}`}
            className="sweep"
            aria-hidden
            style={{
              position: "absolute",
              top: -1,
              left: 0,
              right: 0,
              height: 1,
              background: CLAY,
              transformOrigin: "0% 50%",
              transform: "scaleX(0)",
              opacity: 0,
            }}
          />
          {/* Three boxes across and no gap between them, because the box *is* the
              gap: a tumbling cube is widest across its diagonal and needs 1.8× its
              own size of room, so three of them want 5.4 die-widths of column —
              which is exactly what `--die-size` is solved for in `index.css`. A
              grid that spaces the resting squares instead brings back the bug that
              looks like clipping. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              placeItems: "center",
            }}
          >
            {faces.map((value, index) => {
              const away = gone.includes(index);
              const off = flying.includes(index);
              return (
                <span
                  key={index}
                  style={{
                    // The slot is held whatever happens in it: a die leaving must
                    // not move the five beside it. At the box's size and not the
                    // die's, so the room the cube sweeps through is reserved.
                    width: "calc(var(--die-size) * 1.8)",
                    height: "calc(var(--die-size) * 1.8)",
                    display: "grid",
                    placeItems: "center",
                    ...(off
                      ? vector(index, aside.length + flying.indexOf(index))
                      : {}),
                    ["--i" as string]: String(inHand.indexOf(index)),
                  }}
                >
                  {!away && (
                    <PaperDie
                      key={off ? `fly-${index}` : `hand-${index}-${rollId}`}
                      face={value}
                      size="var(--die-size)"
                      cube={spec.cube}
                      path={spec.cube ? rollPath(value) : undefined}
                      chosen={chosen.includes(index)}
                      boxClass={off ? "fly" : "roll-out"}
                      cubeClass={off ? "" : "roll-cube"}
                      onClick={() => toggle(index)}
                    />
                  )}
                </span>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              minHeight: "var(--play-set-aside)",
            }}
          >
            <span style={{ fontSize: 11, color: QUIET, fontStyle: "italic" }}>
              herausgelegt
            </span>
            {aside.map((value, index) => (
              <PaperDie
                key={`${index}-${value}`}
                face={value}
                size="var(--play-set-aside)"
                spent
                // Only the dice that just arrived play the landing.
                boxClass={index >= aside.length - landing ? "land" : ""}
              />
            ))}
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.4,
          fontStyle: "italic",
          color: QUIET,
          minHeight: 36,
        }}
      >
        {flip?.blurb ?? spec.blurb}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chosen.length > 0 ? (
          <button
            onClick={commit}
            disabled={busy || flying.length > 0}
            style={{ ...pill, background: INK, color: PAPER }}
          >
            herauslegen{" "}
            <span style={{ color: "#e0a883" }}>+{chosen.length * 50}</span>
          </button>
        ) : (
          <button
            onClick={inHand.length === 6 ? newTurn : rollOn}
            disabled={busy || inHand.length === 0}
            style={{
              ...pill,
              background: INK,
              color: PAPER,
              opacity: busy || inHand.length === 0 ? 0.4 : 1,
            }}
          >
            würfeln
          </button>
        )}
        <button
          onClick={newTurn}
          style={{
            minHeight: 40,
            background: "transparent",
            color: QUIET,
            fontFamily: "inherit",
            fontSize: 15,
            textDecoration: `underline 1px ${RULE}`,
            textUnderlineOffset: 5,
          }}
        >
          neuer Zug
        </button>
      </div>
    </div>
  );
}

const pill: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 999,
  fontFamily: 'Georgia, "Iowan Old Style", serif',
  fontSize: 18,
};
