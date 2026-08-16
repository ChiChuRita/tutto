import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { seatNameTaken, type GameState } from "./game/turn";

/**
 * The name this device last took a Seat under. Offered back the next time, so
 * that a second Game is one tap.
 */
const NAME_KEY = "tutto.name";

const button =
  "min-h-14 w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";
const primary = `${button} bg-blue-600 text-white`;

/**
 * Before a Game is played it is a table people sit down at. Everyone gives a
 * name, the Seats fill in the order they were taken — which is the order they
 * will play in — and the Game is started by hand.
 */
export function Lobby({ game }: { game: GameState & { _id: Id<"games"> } }) {
  const takeSeat = useMutation(api.games.takeSeat);
  const start = useMutation(api.games.start);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [failed, setFailed] = useState(false);

  const typed = name.trim();
  // The reducer's own rule, asked before the move rather than after it is
  // refused, so the lobby can say why the button is dead.
  const taken = seatNameTaken(game, typed);

  const act = (call: () => Promise<unknown>) => {
    setFailed(false);
    void call().catch(() => setFailed(true));
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-center text-2xl font-bold">Wer spielt mit?</h2>

      {game.seats.length === 0 ? (
        <p className="text-center opacity-70">Noch niemand am Tisch.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {game.seats.map((seat, index) => (
            <li
              key={index}
              className="flex gap-3 rounded-xl bg-neutral-500/15 p-3 text-lg"
            >
              <span className="opacity-70">{index + 1}.</span>
              <span>{seat.name}</span>
            </li>
          ))}
        </ol>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          act(() =>
            takeSeat({ gameId: game._id, name: typed }).then(() =>
              localStorage.setItem(NAME_KEY, typed),
            ),
          );
        }}
      >
        <input
          className="min-h-14 w-full rounded-xl bg-neutral-500/15 px-4 text-lg"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          aria-label="Name"
          maxLength={40}
        />
        {taken && (
          <p className="text-center opacity-70">
            {/* Two people called Anna at one table is the thing this stops. */}
            Der Name ist an diesem Tisch schon vergeben.
          </p>
        )}
        {failed && (
          <p className="rounded-xl bg-red-500/20 p-3 text-center">
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        )}
        <button
          className={`${button} bg-neutral-500/25`}
          type="submit"
          disabled={typed === "" || taken}
        >
          Platz nehmen
        </button>
      </form>

      <button
        className={`${primary} mt-auto`}
        // A Game with nobody in it has nothing to start.
        disabled={game.seats.length === 0}
        onClick={() => act(() => start({ gameId: game._id }))}
      >
        Los geht&rsquo;s
      </button>
    </div>
  );
}
