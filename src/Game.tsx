import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  canStop,
  cardsLeft,
  scoreSelection,
  validDice,
  winners,
  type GameState,
} from "./game/turn";
import { Die } from "./Die";
import { Lobby } from "./Lobby";
import { CardStack, DrawnCard, EmptyCardSlot } from "./Card";

const button =
  "min-h-14 w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";
const primary = `${button} bg-blue-600 text-white`;

/** A die in hand, a die chosen, and a die that scores nothing all read apart. */
const inHand = "bg-neutral-50 text-neutral-900";
const chosen = "bg-blue-600 text-white";
const worthless = "bg-neutral-400 text-neutral-600";

/** The end of the Game: who won, and what everyone finished on. */
function Result({
  game,
  abandoned,
  onBack,
}: {
  game: GameState;
  abandoned: boolean;
  onBack: () => void;
}) {
  const { seats } = game;
  const won = winners(game);
  const names = won.map((index) => seats[index].name).join(" und ");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-center text-2xl font-bold">Spiel vorbei</h2>
      {/* An abandoned Game keeps its scores but has no winner to name. */}
      <p className="rounded-xl bg-amber-500/15 p-4 text-center text-xl font-bold">
        {abandoned
          ? "Abgebrochen"
          : won.length === 1
            ? `${names} gewinnt!`
            : `Unentschieden: ${names}`}
      </p>
      {/* A Kleeblatt wins from any score, so the scores below will not explain it. */}
      {!abandoned && game.turn.phase === "won" && (
        <p className="text-center text-lg">
          Kleeblatt! Zwei TUTTOs hintereinander.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {seats.map((seat, index) => (
          <li
            key={index}
            className="flex justify-between rounded-xl bg-neutral-500/15 p-3 text-lg"
          >
            <span>{seat.name}</span>
            <span className="font-bold">{seat.score} Punkte</span>
          </li>
        ))}
      </ul>
      <button className={`${primary} mt-auto`} onClick={onBack}>
        Zurück zur Übersicht
      </button>
    </div>
  );
}

export function Game({
  gameId,
  onBack,
}: {
  /** Straight from the address bar, so not necessarily a Game that exists. */
  gameId: string;
  onBack: () => void;
}) {
  const game = useQuery(api.games.get, { gameId });
  const drawCard = useMutation(api.games.draw);
  const roll = useMutation(api.games.roll);
  const setAside = useMutation(api.games.setAside);
  const stop = useMutation(api.games.stop);
  const nextTurn = useMutation(api.games.nextTurn);
  const abandon = useMutation(api.games.abandon);
  const [selected, setSelected] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  // Walking away cannot be undone, so it takes a second tap.
  const [abandoning, setAbandoning] = useState(false);

  if (game === undefined) return <p className="text-center">Lädt …</p>;
  // A link to a Game that never existed, or one typed wrong: say so plainly.
  if (game === null) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-center text-xl">Dieses Spiel gibt es nicht.</p>
        <button className={`${primary} mt-auto`} onClick={onBack}>
          Zurück zur Übersicht
        </button>
      </div>
    );
  }
  if (game.phase === "over") {
    return <Result game={game} abandoned={game.abandoned} onBack={onBack} />;
  }
  // Nobody has rolled anything yet: the Game is still filling its Seats.
  if (game.phase === "lobby") return <Lobby game={game} />;

  const { turn, _id: id } = game;
  const rolled = turn.roll ?? [];
  const valid = validDice(rolled, turn.card, turn.setAside);
  const choosing = turn.phase === "awaitingSetAside";
  const deciding =
    turn.phase === "awaitingCard" || turn.phase === "awaitingRoll";
  const over = !choosing && !deciding;
  const left = cardsLeft(game.deck);
  // Waiting on a Card means none is in force, whether the Turn has just begun
  // or a TUTTO just spent the last one.
  const shown = turn.phase === "awaitingCard" ? null : turn.card;
  const selectionScore = scoreSelection(
    selected.map((index) => rolled[index]),
    turn.card,
    turn.setAside,
  );

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
          {/* Whose Turn it is, over the points that Seat has banked. */}
          <div className="truncate text-sm opacity-70">
            {game.seats[game.activeSeatIndex].name}
          </div>
          <div className="text-3xl font-bold">
            {game.seats[game.activeSeatIndex].score}
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-neutral-500/15 p-3">
          <div className="text-sm opacity-70">Im Zug</div>
          {/* Once the Turn is over its points are banked or forfeited, never at risk. */}
          <div className="text-3xl font-bold">{over ? 0 : turn.score}</div>
        </div>
        <CardStack left={left} />
      </div>

      {game.phase === "finalRound" && (
        <p className="rounded-xl bg-amber-500/25 p-3 text-center font-bold">
          letzte Runde — 6000 sind geknackt. Am Ende gewinnt die höchste
          Punktzahl.
        </p>
      )}

      {/* A Card owed is a Card gone: at the start of a Turn there is none yet,
          and after a TUTTO the old one is spent even though the position still
          carries it. Either way the slot stands empty until the next draw.
          The key is what mounts a fresh element, and so what plays the draw —
          every draw takes one Card out of the deck, so the count always moves. */}
      {shown === null ? (
        <EmptyCardSlot />
      ) : (
        <DrawnCard key={`${shown}-${left}`} card={shown} />
      )}

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
          {/* A Feuerwerk can only end on a Niete, and pays out all the same. */}
          {turn.card === "fireworks"
            ? `Niete! Feuerwerk vorbei, ${turn.score} Punkte gesichert.`
            : "Niete! Alle Punkte aus diesem Zug sind weg."}
        </p>
      )}
      {turn.phase === "stopCard" && (
        <p className="text-center text-xl font-bold">
          Stop-Karte! Der Zug ist vorbei, keine Punkte.
        </p>
      )}
      {turn.phase === "stopped" && (
        <p className="text-center text-xl font-bold">
          Zug beendet. {turn.score} Punkte gesichert.
        </p>
      )}

      {/* A Roll throws only the dice in hand, so only these ever tumble. Each
          Roll mounts a fresh set of dice, which is what starts the animation. */}
      <div className="grid grid-cols-3 justify-items-center gap-3">
        {rolled.map((face, index) => {
          const selectable = choosing && valid[index];
          const isChosen = selected.includes(index);
          return (
            <button
              key={`die-${index}`}
              type="button"
              disabled={!selectable}
              aria-pressed={selectable ? isChosen : undefined}
              onClick={() => toggle(index)}
              className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <Die
                face={face}
                seed={index * 7 + face}
                tumble
                faceClass={
                  selectable ? (isChosen ? chosen : inHand) : worthless
                }
              />
            </button>
          );
        })}
        {turn.roll === null &&
          !over &&
          Array.from({ length: turn.diceInHand }, (_, index) => (
            <div
              key={`hand-${index}`}
              className="die-blank rounded-xl border-2 border-dashed border-neutral-500/40"
            />
          ))}
      </div>

      {turn.setAside.length > 0 && (
        <div>
          <div className="text-sm opacity-70">Herausgelegt</div>
          {/* Set aside and out of play: smaller, darker, and never rerolled. */}
          <div className="flex flex-wrap gap-2 [--die-size:2.25rem]">
            {turn.setAside.map((face, index) => (
              <Die
                key={index}
                face={face}
                seed={index}
                tumble={false}
                faceClass="bg-neutral-700 text-neutral-200"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {choosing && (
          <button
            className={primary}
            disabled={selectionScore === null}
            onClick={act(() => setAside({ gameId: id, dice: selected }))}
          >
            herauslegen{selectionScore ? ` (+${selectionScore})` : ""}
          </button>
        )}
        {turn.phase === "awaitingCard" && (
          <button
            className={primary}
            onClick={act(() => drawCard({ gameId: id }))}
          >
            {/* Rolling on after a Tutto means taking a new Card first. */}
            {turn.tutto ? "weitermachen" : "Karte ziehen"}
          </button>
        )}
        {turn.phase === "awaitingRoll" && (
          <button className={primary} onClick={act(() => roll({ gameId: id }))}>
            Würfeln
          </button>
        )}
        {deciding && (
          <button
            className={`${button} bg-neutral-500/25`}
            // A forcing Card takes stopping away: the move is offered dead
            // rather than offered live and refused by the server.
            disabled={!canStop(game)}
            onClick={act(() => stop({ gameId: id }))}
          >
            aufhören
          </button>
        )}
        {over && (
          <button
            className={primary}
            onClick={act(() => nextTurn({ gameId: id }))}
          >
            Neuer Zug
          </button>
        )}
        <button
          className="min-h-11 text-sm opacity-70"
          onClick={
            abandoning
              ? act(() => abandon({ gameId: id }).then(onBack))
              : () => setAbandoning(true)
          }
        >
          {abandoning ? "Wirklich abbrechen?" : "Spiel abbrechen"}
        </button>
      </div>
    </div>
  );
}
