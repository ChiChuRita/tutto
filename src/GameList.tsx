import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import { MarkWell } from "./Mark";
import { TILE, type Meaning } from "./tiles";

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
 * Which tile a Game wears, and what tapping it does. Both come off the same
 * question — what state is this Game in — so they are answered together rather
 * than by two conditionals that could drift apart.
 *
 * An abandoned Game takes the loss tile and not the win one, whoever was ahead:
 * nobody won it, and the record leaves it out entirely.
 */
function look(game: ListedGame): { meaning: Meaning; action: string } {
  if (game.abandoned) return { meaning: "loss", action: "Ansehen" };
  if (game.phase === "lobby") return { meaning: "waiting", action: "Öffnen" };
  if (game.phase !== "over") return { meaning: "waiting", action: "Weiter" };
  return { meaning: "win", action: "Ansehen" };
}

/**
 * The Games this device is in, newest first. The device asks for them by id —
 * nothing here can turn up a Game belonging to somebody else.
 */
export function GameList({
  gameIds,
  onOpen,
}: {
  gameIds: string[];
  onOpen: (gameId: string) => void;
}) {
  const games = useQuery(api.games.list, { gameIds });

  return (
    <div className="flex flex-1 flex-col gap-4">
      {games !== undefined && games.length > 0 && (
        <h2 className="font-display text-lg font-bold">Deine Spiele</h2>
      )}
      {games === undefined && <p className="text-center text-muted">Lädt …</p>}
      {/* A device with no Game on it yet, said in words. This was nothing at
          all, and nothing on a plain ground reads as a page that failed to
          load: the heading above is hidden while the list is empty, so a first
          visit showed a title, a button, and then blank sheet.
          
          Words and not empty rows. Ruled placeholder rows were tried and are
          the wrong kind of right, because on this ground a row is what a Game
          is, so empty ones invite a tap that does nothing. */}
      {games !== undefined && games.length === 0 && (
        <p className="text-sm text-muted">
          Noch kein Spiel auf diesem Gerät. Mach eins auf und schick den Link
          weiter: wer ihn hat, kann sich einen Platz nehmen.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {games?.map((game) => {
          const { meaning, action } = look(game);
          const tile = TILE[meaning];
          return (
            <li key={game._id}>
              {/* One row, one tap, one thing it does. The row used to be a
                  block of date, state and every Seat's score stacked up — true,
                  and unreadable at a glance. What a Player wants off this
                  screen is which Game this is and whether it is waiting for
                  them; the scores are on the Game's own screen, one tap away. */}
              <button
                className="flex w-full items-center gap-3 rounded-tile bg-raised p-3 text-left shadow-soft"
                onClick={() => onOpen(game._id)}
              >
                <MarkWell name={tile.mark} className={tile.well} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">
                    {game.seats.length === 0
                      ? "Leerer Tisch"
                      : game.seats.map((seat) => seat.name).join(", ")}
                  </div>
                  <div className="truncate text-sm text-muted">
                    {new Date(game._creationTime).toLocaleDateString("de-DE")} ·{" "}
                    {state(game)}
                  </div>
                </div>
                {/* Said as a word rather than a chevron: what tapping does is
                    different for a Game you are mid-way through and one that is
                    over, and an arrow cannot tell you which. */}
                <span
                  className={`shrink-0 rounded-control ${tile.tile} px-3 py-1.5 text-sm font-semibold ${tile.ink}`}
                >
                  {action}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
