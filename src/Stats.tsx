import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * The record: your best Zug ever, then one row per opponent. It is what an
 * account is for, so a guest sees the offer rather than an empty table — and a
 * User who has finished nothing sees why the table is empty.
 */
export function Stats() {
  const stats = useQuery(api.stats.mine);

  if (stats === undefined) return null;

  if (stats === null) {
    return (
      <p className="text-sm opacity-70">
        Mit einem Konto merkt sich Tutto deine Ergebnisse: dein bester Zug und
        deine Bilanz gegen jeden Mitspieler.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl bg-neutral-500/15 p-3 text-center">
        <div className="text-sm opacity-70">Bester Zug</div>
        <div className="text-3xl font-bold">
          {stats.bestTurn === null ? "—" : `${stats.bestTurn} Punkte`}
        </div>
      </div>
      {stats.opponents.length === 0 ? (
        <p className="text-center text-sm opacity-70">
          Noch keine beendeten Spiele. Spiel eines zu Ende, dann steht deine
          Bilanz hier.
        </p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm opacity-70">
              <th className="font-normal">Gegner</th>
              <th className="w-16 text-right font-normal">Spiele</th>
              <th className="w-16 text-right font-normal">Siege</th>
              <th className="w-24 text-right font-normal">Niederlagen</th>
            </tr>
          </thead>
          <tbody>
            {stats.opponents.map((opponent) => (
              <tr key={opponent.id}>
                <td className="truncate">{opponent.name}</td>
                <td className="text-right tabular-nums">{opponent.games}</td>
                <td className="text-right font-semibold tabular-nums">
                  {opponent.wins}
                </td>
                <td className="text-right tabular-nums">{opponent.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
