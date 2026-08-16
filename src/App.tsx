import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { LazyMotion, domAnimation } from "motion/react";
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
    <LazyMotion features={domAnimation} strict>
      {/* `gap-4`, not `gap-6`: in a Game this column has exactly two children —
          the header row and the table — because signing in and the record both
          belong to the start screen. The 8px that buys is part of what keeps
          the Card and all six dice above the fold on a 390×844 phone. */}
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          {gameId !== null && (
            <button className="text-sm underline opacity-70" onClick={toList}>
              Übersicht
            </button>
          )}
          {/* "TUTTO" in caps is the in-game event; the app itself is "Tutto".
              Full size on the start screen, where it is the app's name and
              there is room for it. In a Game it is decoration standing between
              the table and the fold, and the fold is measured in single px: at
              `text-lg` the dice cleared it by 86.5px, which real Safari chrome
              can still eat, and with the title off the screen by 94.5px. So it
              goes — but only from the screen. It stays the page's heading, so
              a screen reader is not handed a Game with no title.
              »Übersicht« is what is left, and it is the working half. */}
          <h1
            className={
              gameId === null
                ? "flex-1 text-center text-3xl font-bold"
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
        {/* The record belongs on the start screen and nowhere else: it is what
          you came back for, and mid-Game it is somebody else's turn. */}
        {gameId === null && <Stats />}
        {gameId === null ? (
          <GameList
            gameIds={gameIds}
            onOpen={(id) => navigate(gameUrl(id))}
            onNewGame={() => void start()}
          />
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
