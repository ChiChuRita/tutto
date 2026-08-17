import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";

type ListedGame = FunctionReturnType<typeof api.games.list>[number];

/** What became of a Game, in one line: still running, won, tied, or walked away from. */
function state(game: ListedGame): string {
  if (game.abandoned) return "Abgebrochen";
  if (game.phase === "lobby") return "Noch nicht gestartet";
  if (game.phase !== "over") return "Läuft";
  const names = game.winners.map((index) => game.seats[index].name);
  return names.length === 1
    ? `${names[0]} gewinnt`
    : `Unentschieden: ${names.join(" und ")}`;
}

/**
 * The Games this device is in, newest first. The device asks for them by id —
 * nothing here can turn up a Game belonging to somebody else.
 */
export function GameList({
  gameIds,
  onOpen,
  onNewGame,
}: {
  gameIds: string[];
  onOpen: (gameId: string) => void;
  onNewGame: () => void;
}) {
  const games = useQuery(api.games.list, { gameIds });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <button
        className="min-h-14 w-full rounded-control bg-sky px-4 text-lg font-semibold text-ink shadow-soft"
        onClick={onNewGame}
      >
        Neues Spiel
      </button>
      {games === undefined && <p className="text-center text-muted">Lädt …</p>}
      {games?.length === 0 && (
        <p className="text-center text-muted">Noch keine Spiele.</p>
      )}
      <ul className="flex flex-col gap-3">
        {games?.map((game) => (
          <li key={game._id}>
            <button
              className="w-full rounded-tile bg-raised p-4 text-left shadow-soft"
              onClick={() => onOpen(game._id)}
            >
              <div className="flex justify-between text-sm text-muted">
                <span>
                  {new Date(game._creationTime).toLocaleDateString("de-DE")}
                </span>
                <span>{state(game)}</span>
              </div>
              {game.seats.map((seat, index) => (
                <div key={index} className="flex justify-between text-lg">
                  <span>{seat.name}</span>
                  <span className="font-bold tabular-nums">
                    {seat.score} Punkte
                  </span>
                </div>
              ))}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
