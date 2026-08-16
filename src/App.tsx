import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Finished } from "./Finished";
import { Game } from "./Game";

/** So a refresh, or a mistap, does not lose the Game in progress. */
const STORAGE_KEY = "tutto.gameId";

export default function App() {
  const [gameId, setGameId] = useState<Id<"games"> | null>(
    () => localStorage.getItem(STORAGE_KEY) as Id<"games"> | null,
  );
  const [showingFinished, setShowingFinished] = useState(false);
  const create = useMutation(api.games.create);

  const start = async () => {
    const id = await create();
    localStorage.setItem(STORAGE_KEY, id);
    setGameId(id);
  };
  const forget = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameId(null);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        {/* "TUTTO" in caps is the in-game event; the app itself is "Tutto". */}
        <h1 className="flex-1 text-center text-3xl font-bold">Tutto</h1>
        {!showingFinished && (
          <button
            className="text-sm underline opacity-70"
            onClick={() => setShowingFinished(true)}
          >
            Frühere Spiele
          </button>
        )}
      </div>
      {showingFinished ? (
        <Finished onBack={() => setShowingFinished(false)} />
      ) : gameId === null ? (
        <button
          className="min-h-14 w-full rounded-xl bg-blue-600 px-4 text-lg font-semibold text-white"
          onClick={() => void start()}
        >
          Neues Spiel
        </button>
      ) : (
        // Both endings — a finished Game and one that is gone — start a new one;
        // an abandoned Game goes back to the start screen instead.
        <Game
          gameId={gameId}
          onLeave={() => void start()}
          onAbandoned={forget}
        />
      )}
    </main>
  );
}
