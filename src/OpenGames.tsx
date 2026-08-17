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
      <h2 className="text-sm font-semibold text-muted">Offene Spiele</h2>
      {games.length === 0 ? (
        // Said rather than left blank. A Player who came here to see whether
        // anyone is waiting has to be able to tell »nobody is« from »this did
        // not load«.
        <p className="text-sm text-muted">
          Gerade wartet kein Tisch. Mach eins auf, dann sieht es dein Mitspieler
          hier.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {games.map((game) => (
            <li key={game._id}>
              <button
                className="w-full rounded-tile bg-raised p-4 text-left shadow-soft"
                onClick={() => onOpen(game._id)}
              >
                <div className="flex justify-between text-sm text-muted">
                  <span>
                    {new Date(game._creationTime).toLocaleDateString("de-DE")}
                  </span>
                  <span>
                    {/* Who is already sitting there is the thing worth knowing
                        before you join, so it is the number and not »offen«. */}
                    {game.seats.length === 0
                      ? "Noch niemand"
                      : `${game.seats.length} ${
                          game.seats.length === 1 ? "Platz" : "Plätze"
                        } belegt`}
                  </span>
                </div>
                <div className="text-lg">
                  {game.seats.length === 0
                    ? "Leerer Tisch"
                    : game.seats.map((seat) => seat.name).join(", ")}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
