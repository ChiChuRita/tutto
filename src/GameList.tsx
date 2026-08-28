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

  const empty = games !== undefined && games.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-2">
      <h2 className="legend text-[0.6rem]">
        Deine Spiele
        {games !== undefined && games.length > 0 && ` · ${games.length}`}
      </h2>
      {games === undefined && (
        <p className="legend py-3 text-center text-[0.6rem]">Lädt …</p>
      )}
      {/*
          A slip nobody has filled in yet — said in words, not in empty boxes.

          This screen used to be nothing at all before a Player's first Game, which
          on a plain ground reads as a page that failed to load. The first fix drew
          three ruled rows here so the sheet looked like a blank form waiting to be
          filled in. That was the wrong kind of right: the rows wore the write-in
          field's own styling, so on a form they *invited a tap*, and the sentence
          directly under them said there was nothing to tap. On an Operate surface
          that is expression sitting on top of a familiar affordance, which is the
          one trade this mode never allows.

          So the empty state is the sentence, and the sentence alone. It says what
          is true and what to do about it, and nothing on the screen pretends to be
          a control.
      */}
      {empty && (
        <p className="text-sm text-muted">
          Noch kein Spiel auf diesem Gerät. Mach eins auf und schick den Link
          weiter: wer ihn hat, kann sich einen Platz nehmen.
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {games?.map((game, index) => {
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
                className="field-live flex w-full items-center gap-3 rounded-tile p-3 text-left"
                onClick={() => onOpen(game._id)}
              >
                {/* The row's number, printed the way a form numbers its lines,
                    so a filled row and an empty one are plainly the same block.
                    Decoration to a screen reader: the names below are the row's
                    real identity. */}
                <span
                  aria-hidden
                  className="legend w-3 shrink-0 text-[0.55rem]"
                >
                  {index + 1}
                </span>
                <MarkWell name={tile.mark} className={tile.well} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">
                    {game.seats.length === 0
                      ? "Leerer Tisch"
                      : game.seats.map((seat) => seat.name).join(", ")}
                  </div>
                  <div className="legend truncate text-[0.55rem]">
                    {new Date(game._creationTime).toLocaleDateString("de-DE")} ·{" "}
                    {state(game)}
                  </div>
                </div>
                {/* Said as a word rather than a chevron: what tapping does is
                    different for a Game you are mid-way through and one that is
                    over, and an arrow cannot tell you which. */}
                <span className="reversed shrink-0 rounded-control px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] uppercase [font-stretch:75%]">
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
