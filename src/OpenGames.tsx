import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * The tables waiting for Players, and the one screen where a Game is found
 * rather than followed to. Everywhere else in this app a Game is reached by its
 * Invite link (ADR 0004); here a signed-in Player sees the open lobbies and
 * sits down at one.
 *
 * Nothing at all for a guest — not an empty list and not an offer. The record
 * below it already makes the case for an account, and a second pitch on the
 * same screen is nagging.
 *
 * »Join« is the Game's own URL and no new path: tapping opens the lobby the
 * Invite link opens, and the Player takes a Seat there exactly as they would
 * have. So there is one way to take a Seat, and this only changes how you find
 * the table.
 */
export function OpenGames({ onOpen }: { onOpen: (gameId: string) => void }) {
  const games = useQuery(api.games.open);

  // Still loading, or a guest — `null` is the query saying this screen is not
  // for you, which is a different answer from an empty list.
  if (games === undefined || games === null) return null;

  return (
    <section className="flex flex-col gap-3">
      {/* A field's caption, not a heading: this is a named block on a form, and
          the count belongs in the caption the way a form numbers its rows. */}
      <h2 className="legend text-[0.6rem]">
        Offene Spiele{games.length > 0 && ` · ${games.length}`}
      </h2>
      {games.length === 0 ? (
        // Said rather than left blank. A Player who came here to see whether
        // anyone is waiting has to be able to tell »nobody is« from »this did
        // not load«.
        <p className="text-sm text-muted">
          Gerade wartet kein Tisch. Mach eins auf, dann sieht es dein Mitspieler
          hier.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game) => (
            <li key={game._id}>
              <button
                className="field-live flex w-full items-center gap-3 rounded-tile p-3 text-left"
                onClick={() => onOpen(game._id)}
              >
                {/* No mark. It used to open with the person from `tiles.ts`,
                    the same drawing on every row, and this is the block whose
                    rows carry the most text: the seat names, a count, a date and
                    the stamp, inside 358px. 44px of that was spent on something
                    identical to the row above it. */}
                <div className="min-w-0 flex-1">
                  {/* Who is already sitting there is the thing worth knowing
                      before you join, so the names lead and the count follows. */}
                  <div className="truncate font-semibold">
                    {game.seats.map((seat) => seat.name).join(", ")}
                  </div>
                  <div className="legend truncate text-[0.55rem]">
                    {game.seats.length}{" "}
                    {game.seats.length === 1 ? "Platz" : "Plätze"} belegt ·{" "}
                    {new Date(game._creationTime).toLocaleDateString("de-DE")}
                  </div>
                </div>
                {/* The row's own stamp. Reversed out, because taking a Seat is
                    the action and this sheet says »this one« by inverting. */}
                <span className="reversed shrink-0 rounded-control px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] uppercase [font-stretch:75%]">
                  Beitreten
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
