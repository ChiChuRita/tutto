import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MarkWell } from "./Mark";
import { TILE } from "./tiles";

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
      {/* The one number worth boasting about, given a tile of its own and the
          mark that goes with it. A Turn's score is violet everywhere in the app
          (`tiles.ts`), and »your best Zug« is a Turn's score — so it is violet
          here rather than picking a colour for the screen it happens to be on. */}
      <div
        className={`flex items-center gap-3 rounded-tile ${TILE.turn.tile} p-4 shadow-soft`}
      >
        <MarkWell name={TILE.turn.mark} className="bg-raised text-violet-ink" />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">Bester Zug</div>
          <div
            className={`font-display text-3xl font-bold ${TILE.turn.ink} tabular-nums`}
          >
            {stats.bestTurn === null ? "—" : `${stats.bestTurn} Punkte`}
          </div>
        </div>
      </div>
      {stats.opponents.length === 0 ? (
        <p className="text-center text-sm text-muted">
          Noch keine beendeten Spiele. Spiel eines zu Ende, dann steht deine
          Bilanz hier.
        </p>
      ) : (
        // One panel per opponent rather than a four-column table. The table read
        // as a spreadsheet on a phone, and the numbers that matter — what you
        // have won and lost against this person — are what a row should lead
        // with. Wins take the win tile and losses the loss one, the same pair
        // they take everywhere else.
        <ul className="flex flex-col gap-2">
          {stats.opponents.map((opponent) => (
            <li
              key={opponent.id}
              className="flex items-center gap-3 rounded-tile bg-raised p-3 shadow-soft"
            >
              <MarkWell name={TILE.player.mark} className={TILE.player.well} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{opponent.name}</div>
                <div className="text-sm text-muted">
                  {opponent.games} {opponent.games === 1 ? "Spiel" : "Spiele"}
                </div>
              </div>
              {/* Two numbers, each on its own tile, so the record reads at a
                  glance instead of being counted out of a row of figures. */}
              <div className="flex gap-2">
                <div
                  className={`rounded-control ${TILE.win.tile} px-3 py-1 text-center`}
                >
                  <div
                    className={`font-display text-lg font-bold ${TILE.win.ink} tabular-nums`}
                  >
                    {opponent.wins}
                  </div>
                  <div className="text-[0.65rem] text-muted">Siege</div>
                </div>
                <div
                  className={`rounded-control ${TILE.loss.tile} px-3 py-1 text-center`}
                >
                  <div
                    className={`font-display text-lg font-bold ${TILE.loss.ink} tabular-nums`}
                  >
                    {opponent.losses}
                  </div>
                  <div className="text-[0.65rem] text-muted">Niederlagen</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
