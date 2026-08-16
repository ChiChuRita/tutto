import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/** Seats have no names yet, so they are known by their place in the order. */
const seatName = (index: number) => `Platz ${index + 1}`;

/**
 * The Games that are done with. Nothing is computed here beyond reading them
 * back: what a Game came to is written down when it ends.
 */
export function Finished({ onBack }: { onBack: () => void }) {
  const games = useQuery(api.games.finished, {});

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-center text-2xl font-bold">Frühere Spiele</h2>
      {games === undefined && <p className="text-center">Lädt …</p>}
      {games?.length === 0 && (
        <p className="text-center opacity-70">Noch keine beendeten Spiele.</p>
      )}
      <ul className="flex flex-col gap-3">
        {games?.map((game) => (
          <li key={game._id} className="rounded-xl bg-neutral-500/15 p-3">
            <div className="flex justify-between text-sm opacity-70">
              <span>
                {new Date(game._creationTime).toLocaleDateString("de-DE")}
              </span>
              {/* An abandoned Game has final scores but no winner. */}
              <span>
                {game.abandoned
                  ? "Abgebrochen"
                  : `${game.winners.map(seatName).join(" und ")} gewinnt`}
              </span>
            </div>
            {game.seats.map((seat, index) => (
              <div key={index} className="flex justify-between text-lg">
                <span>{seatName(index)}</span>
                <span className="font-bold">{seat.score} Punkte</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
      <button
        className="mt-auto min-h-14 w-full rounded-xl bg-neutral-500/25 px-4 text-lg font-semibold"
        onClick={onBack}
      >
        Zurück
      </button>
    </div>
  );
}
