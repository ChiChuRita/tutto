import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";

/** Seats have no names yet, so they are known by their place in the order. */
const seatName = (index: number) => `Platz ${index + 1}`;

type ListedGame = FunctionReturnType<typeof api.games.list>[number];

/** What became of a Game, in one line: still running, won, tied, or walked away from. */
function state(game: ListedGame): string {
  if (game.abandoned) return "Abgebrochen";
  if (game.phase !== "over") return "Läuft";
  return game.winners.length === 1
    ? `${seatName(game.winners[0])} gewinnt`
    : `Unentschieden: ${game.winners.map(seatName).join(" und ")}`;
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
        className="min-h-14 w-full rounded-xl bg-blue-600 px-4 text-lg font-semibold text-white"
        onClick={onNewGame}
      >
        Neues Spiel
      </button>
      {games === undefined && <p className="text-center">Lädt …</p>}
      {games?.length === 0 && (
        <p className="text-center opacity-70">Noch keine Spiele.</p>
      )}
      <ul className="flex flex-col gap-3">
        {games?.map((game) => (
          <li key={game._id}>
            <button
              className="w-full rounded-xl bg-neutral-500/15 p-3 text-left"
              onClick={() => onOpen(game._id)}
            >
              <div className="flex justify-between text-sm opacity-70">
                <span>
                  {new Date(game._creationTime).toLocaleDateString("de-DE")}
                </span>
                <span>{state(game)}</span>
              </div>
              {game.seats.map((seat, index) => (
                <div key={index} className="flex justify-between text-lg">
                  <span>{seatName(index)}</span>
                  <span className="font-bold">{seat.score} Punkte</span>
                </div>
              ))}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
