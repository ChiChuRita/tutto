import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Game } from "./Game";

/** So a refresh, or a mistap, does not lose the Game in progress. */
const STORAGE_KEY = "tutto.gameId";

export default function App() {
  const [gameId, setGameId] = useState<Id<"games"> | null>(
    () => localStorage.getItem(STORAGE_KEY) as Id<"games"> | null,
  );
  const create = useMutation(api.games.create);

  const start = async () => {
    const id = await create();
    localStorage.setItem(STORAGE_KEY, id);
    setGameId(id);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      {/* "TUTTO" in caps is the in-game event; the app itself is "Tutto". */}
      <h1 className="text-center text-3xl font-bold">Tutto</h1>
      {gameId === null ? (
        <button
          className="min-h-14 w-full rounded-xl bg-blue-600 px-4 text-lg font-semibold text-white"
          onClick={() => void start()}
        >
          Neues Spiel
        </button>
      ) : (
        // Both endings — a finished Game and one that is gone — start a new one.
        <Game gameId={gameId} onLeave={() => void start()} />
      )}
    </main>
  );
}
