/**
 * What this device knows about Games: which one the address bar is pointing at,
 * and which ones it has opened before.
 *
 * There is no router. A Game is addressed by a query parameter rather than a
 * path segment so that opening the link directly works on any static host,
 * with no rewrite rule to keep in step. The `URL` and History APIs cover the
 * rest.
 *
 * The list of opened Games is also what makes "my Games" answerable without a
 * query that reads Games belonging to somebody else.
 */

const PARAM = "game";

/** The address of a Game, relative to wherever the app is served from. */
export const gameUrl = (gameId: string) => `?${PARAM}=${gameId}`;

/** The Game the browser is on, or `null` on the start screen. */
export const gameIdIn = (href: string): string | null =>
  new URL(href).searchParams.get(PARAM);

/**
 * The Games this device has opened. Anything else that may be sitting under
 * the key — including the single game id it used to hold — reads as none,
 * because a start screen that throws is worse than one that has forgotten.
 */
export function knownGames(stored: string | null): string[] {
  if (stored === null) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

/** The same list with one more Game in it, ready to be stored again. */
export const remember = (stored: string | null, gameId: string): string => {
  const games = knownGames(stored);
  return JSON.stringify(games.includes(gameId) ? games : [...games, gameId]);
};
