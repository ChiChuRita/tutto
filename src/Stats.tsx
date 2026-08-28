import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MarkWell } from "./Mark";
import { TILE } from "./tiles";

/**
 * The record: your best Zug ever, then one row per opponent. It is what an
 * account is for, so a guest sees the offer rather than an empty table, and a
 * User who has finished nothing sees why the table is empty.
 */
export function Stats() {
  const stats = useQuery(api.stats.mine);

  if (stats === undefined) return null;

  // A guest gets nothing here. The sentence making the case for an account used
  // to render at this point in the column — which put it *below* »Neues Spiel«,
  // three blocks away from the »Anmelden oder Konto anlegen« link it explains, so
  // the page read as a button with an orphaned caption under it. It has moved into
  // `Account.tsx`, next to the control it is about.
  if (stats === null) return null;

  return (
    <section className="flex flex-col gap-3">
      {/* A field's caption, like the two blocks above this one. The record used
          to be the one panel on the start screen with nothing naming it, so the
          page went from »Tutto« into an unheaded figure and a list of people.
          »Bilanz« is not a fresh translation: it is what `Account.tsx` already
          promises an account is for. One heading covers the best Zug as well,
          because that is part of your record rather than a section beside it. */}
      <h2 className="legend text-[0.6rem]">Bilanz</h2>
      {/* The one number worth boasting about, in a machine field: a total the
          form filled in rather than something the Player wrote. It is set on the
          receipt face, because a figure a machine printed is what that face is
          for — and because it is one of the two places in the app where the
          dot-matrix is measurement rather than a costume. The mark is still the
          die, keyed by meaning in `tiles.ts`.

          It renders only once there is a figure in it. `bestTurn` is null exactly
          when `opponents` is empty, both being derived from the finished Games,
          so an empty field here would be a printed box holding a dash directly
          above a sentence explaining why it is empty. */}
      {stats.bestTurn !== null && (
        <div className="field-machine flex items-center gap-3 rounded-tile p-4">
          <MarkWell name={TILE.turn.mark} className={TILE.turn.well} />
          <div className="min-w-0 flex-1">
            <div className="legend text-[0.55rem]">Bester Zug</div>
            <div className="receipt text-3xl leading-none">
              {stats.bestTurn}
              <span className="legend ml-2 align-middle text-[0.55rem]">
                Punkte
              </span>
            </div>
          </div>
        </div>
      )}
      {stats.opponents.length === 0 ? (
        <p className="text-center text-sm text-muted">
          Noch keine beendeten Spiele. Spiel eines zu Ende, dann steht deine
          Bilanz hier.
        </p>
      ) : (
        // One panel per opponent rather than a four-column table. The table read
        // as a spreadsheet on a phone, and the numbers that matter — what you
        // have won and lost against this person — are what a row should lead
        // with.
        //
        // The row carries no mark. It used to open with the person from
        // `tiles.ts`, identical on every row, which is 44px of a 358px row
        // spent on something that told you nothing you could not read in the
        // name beside it. That is the argument `tiles.ts` made when it deleted
        // its five hues, applied to a list instead of to a palette.
        <ul className="flex flex-col gap-2">
          {stats.opponents.map((opponent) => (
            <li
              key={opponent.id}
              className="field flex items-center gap-3 rounded-tile p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{opponent.name}</div>
                {/* Shown only when it is not the sum of the two figures beside
                    it. `statsFor` counts a Game for every one you shared, but a
                    win or a loss only for a clean result, so the count differs
                    from wins plus losses exactly when a Game was tied — won by
                    more than one Seat, where neither beat the other. On every
                    other row it is arithmetic the reader can do, and a number on
                    screen that says nothing is one to delete. */}
                {opponent.games !== opponent.wins + opponent.losses && (
                  <div className="legend text-[0.55rem]">
                    {opponent.games} {opponent.games === 1 ? "Spiel" : "Spiele"}
                  </div>
                )}
              </div>
              {/* One figure in one named box. This was two boxes, »Siege« and
                  »Nlg.«, and that second legend is the tell: `Niederlagen` sets
                  83px in the legend's own type against a box 44px wide, so the
                  app abbreviated a word the rulebook does not abbreviate in
                  order to fit its own layout. One box holds both numbers,
                  yours first, the way every record is written.

                  The glyph is hidden from the accessible tree and the words are
                  given in full beside it. A screen reader saying »neun zu fünf«
                  is not a record, and this is the one place the full
                  »Niederlagen« fits: it costs no width. */}
              <div className="field-machine rounded-tile px-2 py-1 text-center">
                <div
                  className="receipt text-lg leading-none"
                  aria-hidden="true"
                >
                  {opponent.wins}:{opponent.losses}
                </div>
                <span className="sr-only">
                  {opponent.wins} {opponent.wins === 1 ? "Sieg" : "Siege"},{" "}
                  {opponent.losses}{" "}
                  {opponent.losses === 1 ? "Niederlage" : "Niederlagen"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
