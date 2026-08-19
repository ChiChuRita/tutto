/**
 * PROTOTYPE — throwaway. The Arcade table, driveable.
 *
 * The ground is settled — Arcade won the first round — so the skin is fixed here
 * and the only thing that changes between variants is how it moves. Everything is
 * replayable: »Würfeln« throws the dice in hand, tapping dice and »herauslegen«
 * flies them to the row, and the deck draws a Card. Nothing is persisted and
 * nothing talks to a server; faces are drawn locally so a roll can be replayed
 * for as long as it takes to judge it.
 *
 * Not production code. The real thing measures the row's berth before a die
 * flies (as `Game.tsx` already does) and gates every animation on
 * `useReducedMotion`; both are noted where they are faked.
 */
import { useEffect, useMemo, useState } from "react";
import type { Face } from "../../game/turn";
import { ALL_FACES } from "../../dice";
import { ArcadeDie } from "./Die";
import type { Spec } from "./spec";

const LIME = "#c6f24e";
const CYAN = "#4ee0f2";
const GROUND = "#151034";
const WELL = "#0d0a24";
const CHALK = "#f2f0ff";
const DIM = "#9a94c8";

const CARDS = [
  { name: "Bonus 400", effect: "400 Punkte extra, wenn du TUTTO schaffst." },
  { name: "Feuerwerk", effect: "Weiterwürfeln, bis du eine Niete wirfst." },
  { name: "×2", effect: "Der ganze Zug zählt doppelt." },
  { name: "Kleeblatt", effect: "Nur Einsen und Fünfen zählen." },
  { name: "Straße", effect: "Sammle 1 bis 6, sonst nichts." },
];

const roll = () =>
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
    "--dx": `${70 + slot * 34 - (58 + column * 114)}px`,
    "--dy": `${300 - (150 + row * 78)}px`,
  } as React.CSSProperties;
};

export function ArcadeShell({ spec }: { spec: Spec }) {
  // A fresh key on every throw is what restarts the CSS animation — the same
  // mechanism the real screen uses, where the Roll itself is the key.
  const [rollId, setRollId] = useState(1);
  const [faces, setFaces] = useState<Face[]>(roll);
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
    .filter((i) => !gone.includes(i));

  const throwDice = () => {
    setFaces(roll());
    setGone([]);
    setAside([]);
    setChosen([]);
    setLanding(0);
    setRollId((n) => n + 1);
  };

  const rollOn = () => {
    setFaces((now) =>
      now.map((face, i) =>
        gone.includes(i) ? face : ALL_FACES[Math.floor(Math.random() * 6)],
      ),
    );
    setChosen([]);
    setRollId((n) => n + 1);
  };

  const commit = () => {
    if (chosen.length === 0) return;
    setFlying(chosen);
    const taken = chosen.map((index) => faces[index]);
    setTimeout(() => {
      setAside((now) => [...now, ...taken]);
      setLanding(taken.length);
      setGone((now) => [...now, ...chosen]);
      setFlying([]);
      setChosen([]);
    }, spec.flyMs);
  };

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

  const gain = chosen.length * 50;
  const face = CARDS[card];
  // The whole variant's CSS, injected once and scoped to the wrapper class, so
  // three motion languages can define the same hook names without colliding.
  const style = useMemo(() => spec.css, [spec]);

  return (
    <div
      className={`mv-${spec.key}`}
      style={{
        background: `radial-gradient(90% 60% at 50% 15%, #33217a 0%, ${GROUND} 60%)`,
        color: CHALK,
        padding: "var(--play-pad)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        gap: "var(--play-gap)",
        fontFamily: '"Avenir Next", Avenir, system-ui, sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{style}</style>

      {/* The wash a language may put over the whole screen on impact. */}
      <span
        key={`flash-${rollId}`}
        className="flash"
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: LIME,
          opacity: 0,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[
          { name: "Anna", score: 3200, turn: true },
          { name: "Ben", score: 2450, turn: false },
          { name: "Clara", score: 900, turn: false },
        ].map((seat) => (
          <div
            key={seat.name}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 700,
                background: seat.turn ? LIME : "rgb(255 255 255 / 0.12)",
                color: seat.turn ? "#1d2408" : DIM,
                boxShadow: seat.turn ? `0 0 14px ${LIME}70` : "none",
              }}
            >
              {seat.name[0]}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: seat.turn ? CHALK : DIM,
              }}
            >
              {seat.score.toLocaleString("de-DE")}
            </span>
          </div>
        ))}
      </div>

      {/* The Card and the deck it comes off. The Card is keyed on the draw, so
          tapping the deck replays the whole arrival. */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        {/* The hinge's depth lives here and not on the Card: a `perspective`
            set on the element that turns does nothing for its own rotation, and
            the flip comes out flat. */}
        <div
          style={{
            flex: 1,
            position: "relative",
            marginBottom: -10,
            perspective: "44rem",
          }}
        >
          {/* The shockwave a language may put behind the Card. */}
          <span
            key={`wave-${cardId}`}
            className="draw-wave"
            aria-hidden
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: 18,
              border: `2px solid ${CYAN}`,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
          <div
            key={`card-${cardId}`}
            className="draw"
            style={{
              borderRadius: "14px 14px 0 0",
              padding: "10px 14px 14px",
              background: `linear-gradient(180deg, ${CYAN}, #2fa9bd)`,
              color: "#04222a",
              transformStyle: "preserve-3d",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>{face.name}</div>
            <div style={{ fontSize: 11, lineHeight: 1.3, opacity: 0.85 }}>
              {face.effect}
            </div>
          </div>
        </div>
        <button
          onClick={draw}
          style={{
            width: 66,
            borderRadius: "14px 14px 0 0",
            padding: "10px 0 16px",
            background: "rgb(255 255 255 / 0.1)",
            color: CHALK,
            marginBottom: -10,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <div style={{ fontSize: 19 }}>{41 - cardId}</div>
          ZIEHEN
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            key={`well-${rollId}`}
            className="jolt"
            style={{
              borderRadius: 18,
              padding: "26px 14px 14px",
              background: WELL,
              boxShadow:
                "inset 0 8px 22px rgb(0 0 0 / 0.6), inset 0 -1px 0 rgb(255 255 255 / 0.06)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
                placeItems: "center",
              }}
            >
              {faces.map((face, index) => {
                const away = gone.includes(index);
                const off = flying.includes(index);
                return (
                  <span
                    key={index}
                    style={{
                      // The slot is held whatever happens in it: a die leaving
                      // must not move the five beside it.
                      width: "var(--die-size)",
                      height: "var(--die-size)",
                      display: "grid",
                      placeItems: "center",
                      ...(off
                        ? vector(index, aside.length + flying.indexOf(index))
                        : {}),
                      ["--i" as string]: String(inHand.indexOf(index)),
                    }}
                  >
                    {!away && (
                      <ArcadeDie
                        key={off ? `fly-${index}` : `hand-${index}-${rollId}`}
                        face={face}
                        size="var(--die-size)"
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
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                borderRadius: 10,
                background: "rgb(255 255 255 / 0.05)",
                minHeight: "calc(var(--play-set-aside) + 16px)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: DIM,
                }}
              >
                LIEGT
              </span>
              {aside.map((face, index) => (
                <ArcadeDie
                  key={`${index}-${face}`}
                  face={face}
                  size="var(--play-set-aside)"
                  spent
                  flat
                  // Only the dice that just arrived play the landing.
                  boxClass={index >= aside.length - landing ? "land" : ""}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: -16,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "4px 18px",
              borderRadius: 999,
              background: "linear-gradient(180deg, #ff8a3d, #f2542d)",
              color: "#fff",
              fontSize: 22,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              boxShadow: "0 6px 16px rgb(242 84 45 / 0.45)",
              whiteSpace: "nowrap",
              zIndex: 2,
            }}
          >
            {(1250 + aside.length * 50).toLocaleString("de-DE")}
          </div>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          fontWeight: 600,
          color: DIM,
          minHeight: 34,
        }}
      >
        {spec.blurb}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chosen.length > 0 ? (
          <button
            onClick={commit}
            disabled={busy || flying.length > 0}
            style={{
              ...fat,
              background: `linear-gradient(180deg, ${LIME}, #a8d425)`,
              color: "#1d2408",
            }}
          >
            herauslegen +{gain}
          </button>
        ) : (
          <button
            onClick={inHand.length === 6 ? throwDice : rollOn}
            disabled={busy || inHand.length === 0}
            style={{
              ...fat,
              background: `linear-gradient(180deg, ${CYAN}, #2fa9bd)`,
              color: "#04222a",
              opacity: busy || inHand.length === 0 ? 0.55 : 1,
            }}
          >
            Würfeln
          </button>
        )}
        <button
          onClick={throwDice}
          style={{
            minHeight: 40,
            borderRadius: 16,
            background: "rgb(255 255 255 / 0.08)",
            color: DIM,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          neuer Zug
        </button>
      </div>
    </div>
  );
}

const fat: React.CSSProperties = {
  minHeight: 56,
  borderRadius: 16,
  fontSize: 18,
  fontWeight: 800,
  boxShadow: "0 5px 0 rgb(0 0 0 / 0.35), 0 10px 20px rgb(0 0 0 / 0.35)",
};
