import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { scoreSelection, validDice, type Face } from "./game/turn";

const button =
  "min-h-14 w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";
const primary = `${button} bg-blue-600 text-white`;
const dieBox =
  "flex aspect-square items-center justify-center rounded-xl text-3xl";

function Die({ face, className }: { face: Face; className: string }) {
  return <div className={`${dieBox} ${className}`}>{face}</div>;
}

export function Game({
  gameId,
  onMissing,
}: {
  gameId: Id<"games">;
  onMissing: () => void;
}) {
  const game = useQuery(api.games.get, { gameId });
  const roll = useMutation(api.games.roll);
  const setAside = useMutation(api.games.setAside);
  const stop = useMutation(api.games.stop);
  const nextTurn = useMutation(api.games.nextTurn);
  const [selected, setSelected] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);

  if (game === undefined) return <p className="text-center">Lädt …</p>;
  if (game === null) {
    return (
      <button className={primary} onClick={onMissing}>
        Neues Spiel
      </button>
    );
  }

  const { turn } = game;
  const rolled = turn.roll ?? [];
  const valid = validDice(rolled);
  const choosing = turn.phase === "awaitingSetAside";
  const over = turn.phase === "null" || turn.phase === "stopped";
  const selectionScore = scoreSelection(selected.map((index) => rolled[index]));

  // The server owns the position, so a rejected move loses nothing — but it
  // must not look like it worked.
  const act = (call: () => Promise<unknown>) => () => {
    setSelected([]);
    setFailed(false);
    void call().catch(() => setFailed(true));
  };
  const toggle = (index: number) =>
    setSelected((current) =>
      current.includes(index)
        ? current.filter((other) => other !== index)
        : [...current, index],
    );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex gap-3 text-center">
        <div className="flex-1 rounded-xl bg-neutral-500/15 p-3">
          <div className="text-sm opacity-70">Punkte</div>
          <div className="text-3xl font-bold">
            {game.seats[game.activeSeatIndex].score}
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-neutral-500/15 p-3">
          <div className="text-sm opacity-70">Im Zug</div>
          {/* Once the Turn is over its points are banked or forfeited, never at risk. */}
          <div className="text-3xl font-bold">{over ? 0 : turn.score}</div>
        </div>
      </div>

      {failed && (
        <p className="rounded-xl bg-red-500/20 p-3 text-center">
          Das hat nicht geklappt. Bitte nochmal.
        </p>
      )}
      {turn.tutto && (
        <p className="text-center text-xl font-bold">
          TUTTO! Alle sechs Würfel zurück.
        </p>
      )}
      {turn.phase === "null" && (
        <p className="text-center text-xl font-bold">
          Niete! Alle Punkte aus diesem Zug sind weg.
        </p>
      )}
      {turn.phase === "stopped" && (
        <p className="text-center text-xl font-bold">
          Zug beendet. {turn.score} Punkte gesichert.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {rolled.map((face, index) =>
          choosing && valid[index] ? (
            <button
              key={index}
              aria-pressed={selected.includes(index)}
              onClick={() => toggle(index)}
              className={`${dieBox} ${
                selected.includes(index)
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-500/25"
              }`}
            >
              {face}
            </button>
          ) : (
            <Die
              key={index}
              face={face}
              className="bg-neutral-500/10 opacity-40"
            />
          ),
        )}
        {turn.roll === null &&
          !over &&
          Array.from({ length: turn.diceInHand }, (_, index) => (
            <div
              key={index}
              className={`${dieBox} border-2 border-dashed border-neutral-500/40 opacity-40`}
            >
              ?
            </div>
          ))}
      </div>

      {turn.setAside.length > 0 && (
        <div>
          <div className="text-sm opacity-70">Herausgelegt</div>
          <div className="flex gap-2 text-2xl">
            {turn.setAside.map((face, index) => (
              <span key={index}>{face}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {choosing && (
          <button
            className={primary}
            disabled={selectionScore === null}
            onClick={act(() => setAside({ gameId, dice: selected }))}
          >
            herauslegen{selectionScore ? ` (+${selectionScore})` : ""}
          </button>
        )}
        {turn.phase === "awaitingRoll" && (
          <>
            <button className={primary} onClick={act(() => roll({ gameId }))}>
              {turn.tutto ? "weitermachen" : "Würfeln"}
            </button>
            <button
              className={`${button} bg-neutral-500/25`}
              disabled={turn.score === 0}
              onClick={act(() => stop({ gameId }))}
            >
              aufhören
            </button>
          </>
        )}
        {over && (
          <button className={primary} onClick={act(() => nextTurn({ gameId }))}>
            Neuer Zug
          </button>
        )}
      </div>
    </div>
  );
}
