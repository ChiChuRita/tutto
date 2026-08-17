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
    // app's only layout animation (`ROW_SWAP` in `motion.ts` carries why).
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
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-(--play-gap) p-(--play-pad)">
        <div className="flex items-center gap-3">
          {/* The whole of this row in a Game, and it is the way out of one, so
              it is quiet type on the same budget as the screen's other quiet
              type — the row is a fixed cost the table pays at every size. */}
          {gameId !== null && (
            <button
              className="text-(length:--play-note-text)/(--play-note) text-muted underline"
              onClick={toList}
            >
              Übersicht
            </button>
          )}
          {/* "TUTTO" in caps is the in-game event; the app itself is "Tutto".
              Full size on the start screen, where it is the app's name and
              there is room for it. In a Game it is decoration standing between
              the table and the bottom of the screen, and every pixel of that is
              spoken for. So it goes — but only from the screen. It stays the
              page's heading, so a screen reader is not handed a Game with no
              title. »Übersicht« is what is left, and it is the working half. */}
          <h1
            className={
              gameId === null
                ? // The app's name, in the deck's own colour: the wordmark on
                  // the back of every card says the same word, and the two
                  // being one colour is what makes the start screen the front
                  // of this game rather than the front of an app.
                  "flex-1 text-center font-display text-4xl font-extrabold text-orchid"
                : "sr-only"
            }
          >
            Tutto
          </h1>
        </div>
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
          <button
            className="min-h-14 w-full rounded-control bg-azure px-4 font-display text-lg font-bold text-on-accent pressable"
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
