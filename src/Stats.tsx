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
      <p className="text-sm text-muted">
        Mit einem Konto merkt sich Tutto deine Ergebnisse: dein bester Zug und
        deine Bilanz gegen jeden Mitspieler.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      {/* The one number worth boasting about, so it is given the room and the
          colour of a thing worth boasting about. */}
      <div className="rounded-tile bg-raised p-4 text-center shadow-soft">
        <div className="text-sm text-muted">Bester Zug</div>
        <div className="text-3xl font-bold text-mint tabular-nums">
          {stats.bestTurn === null ? "—" : `${stats.bestTurn} Punkte`}
        </div>
      </div>
      {stats.opponents.length === 0 ? (
        <p className="text-center text-sm text-muted">
          Noch keine beendeten Spiele. Spiel eines zu Ende, dann steht deine
          Bilanz hier.
        </p>
      ) : (
        // A row per opponent, each on its own tile: the table used to be four
        // columns of text ruled by nothing, which read as a spreadsheet on a
        // phone. The tiles are the same ones every other list in the app is
        // made of, so the record looks like it belongs to this game.
        <table className="w-full border-separate border-spacing-y-1 text-left">
          <thead>
            <tr className="text-sm text-muted">
              <th className="px-3 font-normal">Gegner</th>
              <th className="w-14 px-1 text-right font-normal">Spiele</th>
              <th className="w-14 px-1 text-right font-normal">Siege</th>
              <th className="w-20 px-3 text-right font-normal">Niederlagen</th>
            </tr>
          </thead>
          <tbody>
            {stats.opponents.map((opponent) => (
              <tr key={opponent.id} className="bg-raised">
                <td className="truncate rounded-l-tile px-3 py-2">
                  {opponent.name}
                </td>
                <td className="px-1 py-2 text-right tabular-nums">
                  {opponent.games}
                </td>
                <td className="px-1 py-2 text-right font-semibold text-mint tabular-nums">
                  {opponent.wins}
                </td>
                <td className="rounded-r-tile px-3 py-2 text-right text-muted tabular-nums">
                  {opponent.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
