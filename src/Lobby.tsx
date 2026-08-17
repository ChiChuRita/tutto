import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { seatNameTaken, type GameState } from "./game/turn";

/**
 * The name this device last took a Seat under. Offered back the next time, so
 * that a second Game is one tap.
 */
const NAME_KEY = "tutto.name";

// A move not on offer drops to the quiet surface rather than fading — see the
// same class in `Game.tsx` for why an accent cannot be faded convincingly.
const button =
  "min-h-14 w-full rounded-control px-4 text-lg font-semibold disabled:bg-raised disabled:text-muted disabled:shadow-none";
const primary = `${button} bg-azure text-ink shadow-soft`;

/**
 * Before a Game is played it is a table people sit down at. Everyone gives a
 * name, the Seats fill in the order they were taken — which is the order they
 * will play in — and the Game is started by hand.
 */
export function Lobby({
  game,
  secret,
  onSeated,
}: {
  game: GameState & { _id: Id<"games"> };
  /** This device's proof of a Seat here, or `null` for nobody yet. */
  secret: string | null;
  onSeated: (gameId: string, secret: string) => void;
}) {
  const takeSeat = useMutation(api.games.takeSeat);
  const start = useMutation(api.games.start);
  // Which Seat is this device's is the server's answer, not the secret's: a
  // secret left over from a Game that is gone proves nothing.
  const mySeat = useQuery(
    api.games.heldSeat,
    secret === null ? "skip" : { gameId: game._id, secret },
  );
  // A signed-in Player takes their Seat under their profile name and types
  // nothing; a guest gives a name. Which of the two is the server's decision —
  // this only stops asking for something that will be ignored.
  const me = useQuery(api.users.me);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [failed, setFailed] = useState(false);

  const seated = mySeat !== undefined && mySeat !== null;
  // Still loading counts as a guest: the form it shows for that one round trip
  // is asking for a name the server will ignore, not taking a wrong Seat.
  const profile = me ?? null;
  const typed = profile === null ? name.trim() : profile.name;
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
        <p className="text-center text-muted">Noch niemand am Tisch.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {game.seats.map((seat, index) => (
            <li
              key={index}
              className="flex gap-3 rounded-tile bg-raised p-3 text-lg shadow-soft"
            >
              <span className="text-muted tabular-nums">{index + 1}.</span>
              <span>{seat.name}</span>
              {/* Which of these is you, so that reopening the link is obvious. */}
              {index === mySeat && <span className="text-muted">(du)</span>}
            </li>
          ))}
        </ol>
      )}

      {failed && (
        <p className="rounded-tile bg-raised p-3 text-center text-ember">
          Das hat nicht geklappt. Bitte nochmal.
        </p>
      )}

      {/* One Seat per device: once you are at the table there is nothing left
          to fill in, and nothing to take a second time. */}
      {seated ? (
        <p className="text-center text-muted">
          Du sitzt am Tisch. Warte, bis es losgeht.
        </p>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            act(() =>
              takeSeat(
                profile === null
                  ? { gameId: game._id, name: typed }
                  : { gameId: game._id },
              ).then((minted) => {
                if (profile === null) localStorage.setItem(NAME_KEY, typed);
                onSeated(game._id, minted);
              }),
            );
          }}
        >
          {profile === null && (
            <input
              className="min-h-14 w-full rounded-control bg-raised px-4 text-lg placeholder:text-muted"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              aria-label="Name"
              maxLength={40}
            />
          )}
          {taken && (
            <p className="text-center text-muted">
              {/* Two people called Anna at one table is the thing this stops. */}
              Der Name ist an diesem Tisch schon vergeben.
            </p>
          )}
          <button
            className={`${button} bg-raised`}
            type="submit"
            disabled={typed === "" || taken}
          >
            {profile === null ? "Platz nehmen" : `Platz nehmen als ${typed}`}
          </button>
        </form>
      )}

      <button
        className={`${primary} mt-auto`}
        // Starting the Game is a Player's move: take your Seat first.
        disabled={!seated}
        onClick={() =>
          act(() => start({ gameId: game._id, secret: secret ?? "" }))
        }
      >
        Los geht&rsquo;s
      </button>
    </div>
  );
}
