import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { LazyMotion, domMax } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  gameIdIn,
  gameUrl,
  heldSeats,
  knownGames,
  remember,
  rememberSeat,
  seatSecretIn,
} from "./device";
import { Account } from "./Account";
import { GameList } from "./GameList";
import { OpenGames } from "./OpenGames";
import { Game } from "./Game";
import { Stats } from "./Stats";

/** Every Game this device has opened, so none of them is lost on a reload. */
const STORAGE_KEY = "tutto.games";

/**
 * The Seats this device holds, one secret per Game (ADR 0004). Kept next to the
 * Games rather than on the Game screen, because it is what makes a Seat survive
 * a refresh — and losing it is losing the Seat.
 */
const SEATS_KEY = "tutto.seats";

/**
 * Two things outside React decide what this screen shows: the address bar,
 * which says which Game you are in, and `localStorage`, which says which Games
 * you have. Both are subscribed to here as one external store.
 *
 * There is no router. `pushState` fires no event of its own, so navigating
 * raises this one — which makes the browser's Back button and our own links the
 * same code path.
 */
const CHANGED = "tutto:changed";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
};

function navigate(url: string) {
  window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(CHANGED));
}

export default function App() {
  const href = useSyncExternalStore(subscribe, () => window.location.href);
  const stored = useSyncExternalStore(subscribe, () =>
    localStorage.getItem(STORAGE_KEY),
  );
  const seats = useSyncExternalStore(subscribe, () =>
    localStorage.getItem(SEATS_KEY),
  );
  const gameId = gameIdIn(href);
  const gameIds = useMemo(() => knownGames(stored), [stored]);
  const secret = gameId === null ? null : seatSecretIn(seats, gameId);
  // Everything this device could claim if its Player signs up or in.
  const held = useMemo(() => heldSeats(seats), [seats]);
  const create = useMutation(api.games.create);
  // The same subscription the Game screen makes, so this costs no extra query.
  const game = useQuery(api.games.get, gameId === null ? "skip" : { gameId });
  const opened = game == null ? null : game._id;

  // Opening a Game — by tapping one, by creating one, or by arriving straight
  // on its URL — is what makes this device remember it. A URL naming no Game
  // is not worth remembering.
  useEffect(() => {
    if (opened === null) return;
    const next = remember(localStorage.getItem(STORAGE_KEY), opened);
    if (next === localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGED));
  }, [opened]);

  const start = useCallback(async () => {
    navigate(gameUrl(await create()));
  }, [create]);
  const toList = useCallback(() => navigate(window.location.pathname), []);
  // Taking a Seat is the one thing that hands this device a secret, and it is
  // written down before anything else happens: without it the Seat is lost.
  const onSeated = useCallback((gameId: string, secret: string) => {
    const next = rememberSeat(localStorage.getItem(SEATS_KEY), gameId, secret);
    localStorage.setItem(SEATS_KEY, next);
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return (
    // The animation features are loaded here rather than pulled in by every
    // `motion.div` that touches the tree. `strict` is what keeps it that way: it
    // makes a `motion.*` component throw, so the only way to animate is the `m`
    // components this provider feeds.
    //
    // `domMax` and not `domAnimation`, and the difference is one feature: the
    // leaderboard rows swap places when a score overtakes, and layout animation
    // is the half of the library that is not in the smaller bundle. It is the
    // app's only layout animation, in its two places: those rows and the full
    // table behind the tap, which is ranked by the same function and so swaps
    // for the same reason (`ROW_SWAP` in `motion.ts` carries why).
    //
    // It costs 13.35 kB gzipped — 122.64 against 135.99, off `npm run build`
    // with the one word here changed and nothing else — which is very nearly
    // the whole of what moving to `LazyMotion` banked in the first place. 46.75
    // kB before gzip. The Player is paying it for one movement, once a Turn at
    // the most, and it also brings drag along, which nothing here uses.
    // Measured rather than described, because a feature set widened without a
    // figure is how a bundle grows for reasons nobody can find later.
    <LazyMotion features={domMax} strict>
      {/* The page's margin and the gap between everything stacked in it are the
          first things to give when the screen is short: air costs nothing to
          lose and the play screen has to fit inside the viewport whatever the
          browser has left of it. Both come off `--room` in `index.css`, which
          is where the whole budget is written down.
          `min-h-dvh` and not `h-dvh`: on the screens that legitimately have
          more to say than fits — the Games list, the record — the column still
          grows and the page still scrolls. It is the play screen that may
          not. */}
      {/* `justify-content: safe center` on the column, which does one thing on
          each kind of screen and nothing on the play screen.
          A Tippschein is a small sheet, so the column stays `max-w-md` at every
          width — widening it on a desktop would make it a web page rather than a
          document. What it should not be is a document pinned to the top of a
          1440×900 field with two thirds of the window empty below it, which is a
          mobile layout on a big screen rather than a decision. Centred, it reads
          as a sheet placed on a surface.
          It cannot disturb the table: the play screen's own column is `flex-1`,
          so it absorbs every spare pixel and there is no free space for
          `justify-content` to distribute. `safe` is what keeps the overflow case
          honest: on a screen too short for the content, centring would push the
          top of the column out of reach above the viewport, and `safe` falls back
          to flex-start instead.
          Measured in the tallest state the play screen has, both moves live and
          dice in the field: it fits down to **521px** of viewport height at 390,
          375 and 320px wide. Against the 512.8px the ground this replaced
          recorded, that is an **8px regression** — not parity and not an
          improvement. The value axis and the reversed active-Seat row bought it,
          and both were judged worth the pixels. It stays inside the 553px case
          `index.css` budgets against, so the binding no-scroll constraint holds.
          Three earlier figures in this comment were superseded before this one;
          if the column changes again, re-measure in the tallest state and correct
          the number here rather than leaving a stale one for a reader to trust. */}
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-(--play-gap) p-(--play-pad) [justify-content:safe_center]">
        {/*
            The slip's masthead.

            A form names itself across the top, in a band, with its edition set
            small beside the name — and that is exactly the information this app
            already had lying around unused: it implements the 2024 edition of a
            game published in 1994, and it is unofficial. That line was in the
            README and nowhere a Player could see it. On a betting slip it is not
            small print, it is what a masthead is *for*.

            So the heading is a reversed band, the way a slip prints its title,
            with the edition legend under it on the sheet. It also does the job the
            old centred wordmark was doing badly: at `text-4xl` centred on a plain
            ground, »Tutto« was the only thing on the screen with any weight and it
            still read as an app header rather than as a document.

            In a Game it collapses to `sr-only` exactly as before — every pixel
            between the table and the bottom of the screen is spoken for — so the
            band is the start screen's, and the heading survives for a screen
            reader either way.
        */}
        {gameId === null ? (
          <header className="flex flex-col">
            <div className="reversed flex items-baseline justify-between gap-3 px-3 py-2">
              <h1 className="font-display text-3xl leading-none font-extrabold tracking-[-0.02em] [font-stretch:112%]">
                Tutto
              </h1>
              {/* The slip's own designation. Four characters in the legend voice,
                  which is the same field the Cards carry their index in — so the
                  masthead and the deck speak one vocabulary. */}
              <span aria-hidden className="legend text-[0.6rem]">
                Spielschein
              </span>
            </div>
            {/* The edition line, on the sheet under the band. Two facts, both
                true and both already in the repo: which rulebook this follows,
                and that it is not the publisher's. */}
            <p className="legend mt-1 text-[0.55rem] leading-[1.5]">
              Würfelspiel · Ausgabe 2024 · nicht amtlich
            </p>
            <div className="perf mt-2" />
          </header>
        ) : (
          <div className="flex items-center gap-3">
            {/* The whole of this row in a Game, and it is the way out of one, so
                it is quiet type on the same budget as the screen's other quiet
                type — the row is a fixed cost the table pays at every size. */}
            <button
              className="text-(length:--play-note-text)/(--play-note) text-muted underline"
              onClick={toList}
            >
              Übersicht
            </button>
            <h1 className="sr-only">Tutto</h1>
          </div>
        )}
        {/* Signing in belongs on the screens before play: the start screen, and
          the lobby, where it saves you typing your name. Mid-Game it is noise. */}
        {(gameId === null || game?.phase === "lobby") && (
          <Account held={held} />
        )}
        {/* The screen's one loud action, and it sits directly under who you
          are rather than under everything there is to read. It used to live
          inside the Games list, which put it below the open tables the moment
          there were any — the primary thing on the screen, pushed off the fold
          by a list. */}
        {gameId === null && (
          // The slip's submit field: the one thing on the sheet that is stamped
          // rather than printed. Tracked caps, because a submit field on a form
          // is set that way and because it is the only control here that starts
          // something rather than opening something.
          <button
            className="min-h-14 w-full rounded-control bg-azure px-4 font-display text-base font-bold tracking-[0.12em] text-on-accent uppercase [font-stretch:88%] pressable"
            onClick={() => void start()}
          >
            Neues Spiel
          </button>
        )}
        {/* The tables waiting for somebody, above the record and below the
          account that is what makes them visible at all. It is the actionable
          half of this screen — there is a Game to join right now — and the
          record is the half you read. */}
        {gameId === null && (
          <OpenGames onOpen={(id) => navigate(gameUrl(id))} />
        )}
        {/* The record belongs on the start screen and nowhere else: it is what
          you came back for, and mid-Game it is somebody else's turn. */}
        {gameId === null && <Stats />}
        {gameId === null ? (
          <GameList gameIds={gameIds} onOpen={(id) => navigate(gameUrl(id))} />
        ) : (
          <Game
            gameId={gameId}
            secret={secret}
            onSeated={onSeated}
            onBack={toList}
          />
        )}
      </main>
    </LazyMotion>
  );
}
