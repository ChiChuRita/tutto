import { useEffect, useRef, useState, type RefObject } from "react";
import { spunTo } from "./spin";

/**
 * The wind-up, on the screen and under the thumb: the dice turning while
 * »Würfeln« is held down, and the gesture that holds it.
 *
 * Both halves are here because both are the same event seen from two sides, and
 * because the second one is where the phone realities live — a finger sliding
 * off the button, a long-press menu, an assistive click that is a click and
 * nothing else. None of them may leave the dice turning for ever or throw twice.
 *
 * Neither half decides anything. The Roll is a mutation sent on release and the
 * faces are the server's (ADR 0001); everything here is decoration over the
 * moment before that, and the settle afterwards — the part that *is* a replay —
 * belongs to `settled.ts` and is the same length however long the hold ran.
 */

/**
 * Turn the dice inside `element` as though they had been winding up since
 * `since`, or leave them alone for `null`.
 *
 * Two custom properties on the one element the dice sit in, written from a
 * frame loop: the cubes read them in their own `transform`, so a spin at 60fps
 * costs two property writes a frame and no React render at all. Held here
 * rather than in state for that reason — a spin that re-rendered the play
 * screen sixty times a second would drag the Card, the scoreboard and the
 * »Herausgelegt« row through every frame of it.
 *
 * The angle comes from the elapsed time rather than from adding up frames, so a
 * dropped frame, a stall on the network or a tab coming back from the
 * background cannot leave the dice at an angle that depends on how the last few
 * seconds happened to be scheduled. It is also what lets a watching phone start
 * mid-hold from a timestamp it was handed and land in the same place.
 *
 * Which holds only because that timestamp is the press and never moves while
 * the thumb is down. Retimed mid-hold — by a refresh writing a fresh `now`, say
 * — every watching phone's dice would snap back to where a hold that had just
 * started points and drop to the resting speed, over and over, while the phone
 * that made the hold showed none of it. Nothing rewrites it; `presence.ts`
 * carries the rest of that.
 */
export function useSpin(
  element: RefObject<HTMLElement | null>,
  since: number | null,
): void {
  useEffect(() => {
    const node = element.current;
    if (node === null || since === null) return;
    let frame = 0;
    const turn = () => {
      const { x, y } = spunTo(Date.now() - since);
      node.style.setProperty("--spin-x", `${x}deg`);
      node.style.setProperty("--spin-y", `${y}deg`);
      frame = requestAnimationFrame(turn);
    };
    turn();
    return () => {
      cancelAnimationFrame(frame);
      // Left set, the last angle would be the angle the next wind-up started
      // from — and the dice that are about to mount take their rotation from
      // the face the server chose, not from here.
      node.style.removeProperty("--spin-x");
      node.style.removeProperty("--spin-y");
    };
  }, [element, since]);
}

/**
 * How long after a pointer gesture a `click` still belongs to it. A press
 * releases and the browser sends `click` afterwards; that click is the same
 * throw and must not be a second one. Generous, because the only thing on the
 * other side of the window is a Player who pressed the button with a finger and
 * then reached for the keyboard inside a second.
 */
const GESTURE_CLICK_MS = 700;

/** What to spread on »Würfeln«, and how long it has been held. */
export type Hold = {
  /** When the thumb went down, or `null` for a button nobody is holding. */
  since: number | null;
  handlers: {
    onClick: () => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp?: () => void;
    onPointerCancel?: () => void;
    onContextMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
};

/**
 * Press and hold to wind up; let go to throw.
 *
 * A tap throws too, and so does `Enter`, and so does an assistive click — the
 * hold is an enhancement on top of a button that is still a button. Press and
 * hold is a gesture plenty of people cannot make, and it is not something the
 * app is allowed to want badly enough to trade that away. The plain `click` is
 * therefore the path that always works and the pointer handlers are the ones
 * that sit on top; under reduced motion the pointer handlers are not attached
 * at all, so a press is a click, the Roll goes at once and nothing spins.
 */
export function useHold({
  still,
  throwDice,
  wind,
  thrown,
}: {
  /** The Player has asked for no movement, so there is no wind-up to make. */
  still: boolean;
  /** Send the Roll. Rejecting is how this learns the dice are not coming. */
  throwDice: () => Promise<unknown>;
  /** Tell the table a thumb is down, so it can watch the dice turn too. */
  wind: () => void;
  /** A Roll is on the table: whatever was being wound up has arrived. */
  thrown: boolean;
}): Hold {
  const [since, setSince] = useState<number | null>(null);
  /** When a pointer gesture last did something, so its `click` can be known. */
  const gestured = useRef(0);
  /** This press has already thrown. One press, one Roll, however it ends. */
  const already = useRef(false);
  // The callbacks close over the Game, which changes every time anything at the
  // table does. Kept in a ref so that a hold in progress is not restarted by a
  // table-mate's move landing mid-wind-up.
  const latest = useRef({ throwDice, wind });
  useEffect(() => {
    latest.current = { throwDice, wind };
  });

  // The dice keep turning until the Roll is on the table, which is what makes
  // the wind-up cover the round trip: the mutation goes on release and the
  // faces come back a moment later, and there is no frame in between where the
  // table is standing still with nothing to show.
  //
  // Adjusted during the render that brings the Roll in rather than in an effect
  // after it. The hold is over the moment the dice exist, and an effect would
  // put a rendered frame between the two — one frame of a wound-up hand drawn
  // over a Roll that had already arrived, and a second render to take it away.
  const [wasThrown, setWasThrown] = useState(thrown);
  if (wasThrown !== thrown) {
    setWasThrown(thrown);
    if (thrown) setSince(null);
  }

  // A hold is said once, when the thumb goes down, and not again while it lasts.
  // Saying it again would mean writing a timestamp over the one the watching
  // table is turning its dice from, which snaps them back and drops them to the
  // resting speed every time — so what keeps a watcher's dice up through a long
  // hold is `WINDING_FOR_MS`, which is sized for exactly that.

  const release = () => {
    if (already.current) return;
    already.current = true;
    // The spin is left running: the Roll landing is what stops it, above. If it
    // never lands there is nothing to wait for, so the dice come to rest and
    // »Das hat nicht geklappt« has the screen to itself.
    latest.current.throwDice().catch(() => setSince(null));
  };

  const start = (event: React.PointerEvent<HTMLButtonElement>) => {
    // A right-click or a second finger is not a throw.
    if (event.button !== 0) return;
    gestured.current = Date.now();
    already.current = false;
    // The release is ours wherever it happens. This is what a finger sliding
    // off the button comes to: the button keeps the pointer, so `pointerup`
    // arrives here rather than somewhere else, and there is no way to end up
    // holding a button that has stopped listening.
    event.currentTarget.setPointerCapture(event.pointerId);
    setSince(Date.now());
    latest.current.wind();
  };

  const end = () => {
    gestured.current = Date.now();
    release();
  };

  const onClick = () => {
    // The `click` the browser sends after a press it has already handled.
    if (Date.now() - gestured.current < GESTURE_CLICK_MS) return;
    // A throw with no pointer behind it at all — `Enter`, `Space`, an assistive
    // click — so there was no wind-up and there is nothing to wind down. The
    // shortest spin there is, which is none, and the dice go straight to the
    // settle every other throw ends in.
    already.current = false;
    release();
  };

  /**
   * A key held down repeats, and on a button every repeat is another activation
   * — `Enter` leant on for a second is half a dozen clicks and, without this,
   * half a dozen Rolls from one press. Refusing the repeat's default action is
   * what stops the click being made at all, which is better than counting
   * clicks afterwards: there is nothing to undo and nothing to guess at.
   *
   * It is not the keyboard's version of the hold. `Enter` throws at once and
   * with the shortest spin, which is none, and holding it does not wind
   * anything up — the wind-up is an enhancement for a thumb and the button
   * underneath it stays a plain button.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat) event.preventDefault();
  };

  return {
    since,
    handlers: still
      ? { onClick, onKeyDown }
      : {
          onClick,
          onKeyDown,
          onPointerDown: start,
          onPointerUp: end,
          // The system has taken the pointer away — a gesture the browser
          // decided was a scroll, a call arriving. The finger may still be
          // down and nothing more is coming, so this throws rather than
          // leaving the table turning on a hold nobody can end.
          onPointerCancel: end,
          // The long-press menu, which is exactly what a ten-second hold looks
          // like to a phone. Refused outright: there is nothing on this button
          // to copy or share, and the menu would take the release with it.
          onContextMenu: (event) => event.preventDefault(),
        },
  };
}
