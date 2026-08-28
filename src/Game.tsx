import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  m,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  canStop,
  cardsLeft,
  FINAL_ROUND_SCORE,
  scoreSelection,
  seatMayPlay,
  winners,
  type Face,
  type GameState,
} from "./game/turn";
import { Die } from "./Die";
import { MarkWell } from "./Mark";
import { TILE } from "./tiles";
import { Lobby } from "./Lobby";
import { forfeitedToANull, turnMessage } from "./message";
import {
  affordsLeaderboard,
  leaderboard,
  ranking,
  scoreboardRow,
} from "./scoreboard";
import { CardEffect, CardStack, PlayedPile } from "./Card";
import { cardBeneath, cardInForce, cardOnTop } from "./cards";
import { deckLabel, deckMove } from "./deck";
import type { FlightStart } from "./flight";
import {
  COUNT_POP,
  COUNT_POP_SCALE,
  DIE_LANDING,
  JOLT,
  JOLT_Y,
  ROW_SWAP,
  SWEEP,
  SWEEP_EASE,
  SWEEP_X,
} from "./motion";
import type { Presence } from "./presence";
import { chosenDice, rollKey } from "./selection";
import { inTableOrder, takeoffs, type HandDie } from "./setAside";
import { spinningSince } from "./spin";
import { useCount, useCounts } from "./useCount";
import { usePublishedSelections, usePublishSelection } from "./useSelection";
import { usePresence, useWinding } from "./usePresence";
import { useSettled } from "./useSettled";
import { useHold, useSpin } from "./useSpin";

/**
 * A move. `--play-slot` is the height the screen can afford it — 3.5rem where
 * there is room and never below 2.75rem, because a move you cannot hit is a
 * move you do not have. The slot it sits in holds the same height whether or
 * not this phase offers the move, so nothing shifts between taps.
 */
/*
 * A move that is not on offer loses its ground rather than fading: an accent
 * faded over a dark page comes out a solid mid-slate, which reads as a button
 * you may press rather than one you may not. So a disabled move drops to the
 * quiet surface instead, which is a colour and not a percentage of one.
 */
// A submit field on the slip: stamped, tracked caps, the same voice as »Neues
// Spiel« and »Platz nehmen« on the screens before this one. It was lower case
// here and upper everywhere else, which made the two loudest controls in the app
// look like they came from different products.
//
// `text-base` and not `text-lg`: tracked caps at 18px overflow »herauslegen« on a
// 320px column, and the tracking is what makes a stamp read as one.
const button =
  "min-h-(--play-slot) w-full rounded-control px-3 text-base font-semibold tracking-[0.1em] uppercase [font-stretch:80%] disabled:bg-off disabled:text-off-ink disabled:shadow-none";
const primary = `${button} bg-azure text-on-accent pressable`;

/**
 * Every die in a Roll looks the same. Which of them score is the Player's to
 * work out — it is most of the skill in Tutto — so the only thing a die says is
 * whether the Player has picked it up.
 *
 * On a slip that is not a second colour, it is the mark. A die in the hand is
 * printed in the stock with ink pips, the way the form printed it; a die the
 * Player has picked up is the *same drawing reversed out* — ink ground, stock
 * pips — which is what a pen does to a box on a form and what a selection has
 * always done on a monochrome sheet.
 *
 * Why this beats the hue it replaces, and it is not only palette discipline.
 * Terracotta-on-paper was 4.43:1; reversed ink is 14.91:1, so the picked-up state
 * is now the highest-contrast thing on the table — which is right, because it is
 * the one thing on the table the Player themselves put there. It also survives
 * the scene: the app is used in bright daylight, where a mid-tone accent is the
 * first thing a screen loses and full inversion is the last.
 */
const inHand = "bg-die text-ink";
const chosen = "bg-ink text-on-accent";

/*
 * There is no `focus` string here any more, and that is the point.
 *
 * Every control on this screen used to append one — three Tailwind utilities
 * repeated at each call site — which is thirty copies of a promise none of them
 * could keep. `index.css` now draws one `:focus-visible` ring for every focusable
 * thing in the app, in the ink, on an offset, which is what WCAG 2.4.11 asks for
 * and what a per-call-site string cannot guarantee for the controls that forgot
 * to ask.
 */

/**
 * One Seat's presence: filled if its Player still has the Game open, an empty
 * ring if not, and nothing at all for `null` — a Seat nothing is known about
 * yet, or one the row has decided not to speak for. Not yet known is not the
 * same as away. Away is a quiet state: nobody is being kicked and no Turn is
 * being skipped (ADR 0005), so it is a dot and not a warning.
 *
 * The same 8px in every state, because the row it sits in holds one fixed
 * height and the play screen must hold still under the Player's thumb. Filled
 * against hollow rather than one colour against another, so it survives a
 * screen in the sun and eyes that do not separate the two — and it is said in
 * words for a reader that sees neither.
 */
function PresenceDot({ present }: { present: Presence }) {
  return (
    // It is a word now, not a dot.
    //
    // It was an 8px circle, filled for here and hollow for away — the only round
    // object left on a sheet where every other field carries a printed legend and
    // nothing else has a curve. Unlabelled, it asked a Player to learn that one
    // ring means the opposite of the other, and it could not say which without the
    // screen-reader text nobody sees. A form does not encode a fact in an unlabelled
    // glyph; it prints the fact in the field.
    //
    // So the state is spelled, in the legend voice, in the ink of whatever row it
    // sits in — which keeps the one thing the dot did well: on a reversed row the
    // ground is the ink, and `currentColor` is what stops the mark disappearing
    // into it. The screen-reader phrasing is unchanged, so nothing an assistive
    // reader was told has been taken away; it is now told to everyone.
    //
    // `w-6` and `justify-start`, so a row's height and its right edge do not move
    // between »da«, »weg« and a Seat nothing is known about yet.
    <span className="legend inline-flex w-6 shrink-0 justify-start text-[0.5rem]">
      {present !== null && (
        <>
          <span aria-hidden>{present ? "da" : "weg"}</span>
          {/* It sits after the name it is about, so it is read as the phrase
              that follows it rather than as a sentence of its own. */}
          <span className="sr-only"> — gerade {present ? "da" : "weg"}</span>
        </>
      )}
    </span>
  );
}

/**
 * A number counting on a clock of its own, for the one number on this screen
 * that is nobody's score: »Im Zug«, rising as dice are set aside and draining
 * when the Turn ends. The count lives in here rather than in the row it stands
 * in, so a number running re-renders itself thirty times and leaves the table
 * around it alone.
 *
 * Every Seat's score is the other case and is not this: those are counted
 * together, on one clock, by the `Scoreboard` that has to rank them
 * (`useCounts`), and reach the screen as `Counted`.
 */
function Counting({ value }: { value: number }) {
  const shown = useCount(value);
  return <Counted shown={shown} value={value} />;
}

/**
 * A score, counting to its new value rather than jumping to it — so what you
 * read is the size of what just happened and not only the result. Every number
 * on this screen wears it: a Seat's when a Turn is banked, all of them at once
 * when a Plus/Minus pays the Player and docks the leaders, and »Im Zug« as dice
 * are set aside and when the Turn empties it again.
 *
 * Where the count is run is not this component's business — it is handed the
 * value the count has reached and the value it is going to, and lands the one
 * on the other. That is what lets the leaderboard rank its rows on the numbers
 * being shown: one clock over every Seat's score, in the one place that can see
 * them all at once, rather than a clock per number and nothing able to compare
 * them.
 *
 * Tabular figures, because the digits change under each other: a proportional
 * »1« is narrower than a »4«, and a number counting through a few hundred of
 * them would breathe in and out.
 *
 * That is not enough on its own, and the reason it was once thought to be was
 * wrong. A count does stay between its two ends — but the ends can be different
 * widths, and the drain a Niete plays is exactly that case: 1000 passing
 * through four digits to land on one. Whatever sits beside the number would
 * move in as it narrowed. »Im Zug« happens to be safe, because it is `flex-1`
 * and takes its width from the row; the score in a list is not, and
 * »am Zug« beside it would creep across as a Plus/Minus docked that Seat.
 *
 * So the number's place is reserved rather than argued about: five digits, in
 * `ch`, which with tabular figures is exactly five of these digits wide. Every
 * score one of these Games reaches fits — 6000 opens the Final round, and the
 * largest a Turn has been seen to bank is five digits.
 * TODO: a six-digit score would widen the place as it crossed; reserve from the
 * widest number the count passes through if a Game ever gets that far.
 */
function Counted({ shown, value }: { shown: number; value: number }) {
  // The one mechanism for reduced motion in the app, the same hook the dice,
  // the Card and the settled position ask. `useCount` asks it too and hands
  // back the number outright, so a count that never ran has nothing to land.
  const still = useReducedMotion();
  // The full stop on the end of a count: the number swells and settles back.
  // A `scale`, so five reserved characters stay five reserved characters and
  // nothing beside it moves.
  const pop = useAnimationControls();
  // Landed is the ordinary state of a number — it is true whenever nothing is
  // running — so what is watched for is it becoming true *again*. That is what
  // this ref holds: whether there was a count to finish.
  const counting = useRef(false);
  const landed = shown === value;

  useEffect(() => {
    if (!landed) {
      counting.current = true;
      return;
    }
    if (!counting.current || still) return;
    counting.current = false;
    void pop.start({ scale: [COUNT_POP_SCALE, 1] }, COUNT_POP);
  }, [landed, still, pop]);

  return (
    <m.span animate={pop} className="inline-block min-w-[5ch] tabular-nums">
      {shown}
    </m.span>
  );
}

const onResize = (changed: () => void) => {
  window.addEventListener("resize", changed);
  return () => window.removeEventListener("resize", changed);
};

/**
 * The height the browser is offering right now — `--room`'s `dvh` asked in
 * JavaScript, because how many rows fit is a count and CSS can only give the
 * screen a height. `innerHeight` is the live viewport on a phone: a Safari
 * sliding its toolbars back in hands it over and fires the event this listens
 * to, exactly as it does for `dvh`.
 */
const useViewportHeight = () =>
  useSyncExternalStore(onResize, () => window.innerHeight);

/**
 * The whole table in one control: whose Turn it is, where you stand, and every
 * Seat's score behind the tap. Everyone sees the same list, because Tutto hides
 * nothing but the undrawn deck, so a Spectator's scoreboard is a Player's
 * scoreboard.
 *
 * How much of the standing it shows is what the screen can pay for. A row per
 * Seat costs about 104px on a phone and the screen has never had 104px: at four
 * Seats it was that much over a 390×844 viewport all by itself. So it is a
 * window of three rows — the Seat above, you, the Seat below — on a screen with
 * about 34px to spare for them, and the one row it has always been on a screen
 * without. The full table is a tap away either way, so summarising never hides
 * anything.
 *
 * Ranked, and never in turn order: "above" and "below" are the words a Player
 * uses about a score, and whose Turn it is is said in the line above the rows
 * and by which buttons are live.
 *
 * The control is a fixed height that never changes with what it has to say, and
 * a modal dialog sits outside the flow, so opening and closing it moves nothing
 * behind it — the play screen holds still under the Player's thumb.
 *
 * It is also where presence lives, for the same reason the scores do: this
 * device's check-ins and everyone else's are read here, off their own
 * subscription, so a heartbeat every ten seconds re-renders this row and leaves
 * the dice and the Card alone.
 *
 * The dice grid reads that same subscription now, for the selection that shares
 * the row, so a die tap re-renders this row too. It is a row of text and a
 * count that is not counting, which is the price of one per-Seat document
 * instead of two — and it is still nowhere near the Game document, which is the
 * line that matters.
 */
function Scoreboard({
  game,
  gameId,
  secret,
  mySeat,
}: {
  /**
   * The settled position, or `null` on a screen that has just opened on a Roll
   * it has not yet shown landing. Scores are outcomes, so this row reads them
   * where the rest of the news is read and never off the live position — and
   * they count to their new values from here rather than jumping to them.
   */
  game: GameState | null;
  /** The Game itself, not the string in the address bar: this one exists. */
  gameId: Id<"games">;
  /** This device's proof of its Seat (ADR 0004), or `null` if it holds none. */
  secret: string | null;
  /** This device's Seat, or `null` for a Spectator. */
  mySeat: number | null;
}) {
  const rowButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const still = useReducedMotion();
  const { turn, standing, score } = scoreboardRow(game, mySeat);
  // Three rows where the screen has the height for them and one where it has
  // not — the play screen's budget answered with a count. Read here rather than
  // anywhere else on the screen because this is the only thing on it that
  // changes shape rather than size.
  const board = affordsLeaderboard(useViewportHeight());
  // Every Seat's score as it reads on screen this frame, on one clock, and the
  // only clock any of them is on: the leaderboard rows, this device's own score
  // in the collapsed row and the full table behind the tap all read out of
  // here. One because the ranking is made out of them — a row changes place on
  // the step its number crosses its neighbour's, so the swap is caused by the
  // count and can never be announced ahead of it — and one everywhere else
  // because a second clock counting the same Seat's score to the same value is
  // work for nothing, whichever of the two regimes the screen is in.
  //
  // What it costs is that this component re-renders for every frame of a count
  // rather than each number re-rendering itself, and that is the trade: a bank
  // at four Seats now runs one rAF loop where it ran five, and re-renders a row
  // of text and a shut dialog's list instead of five numbers.
  //
  // The numbers being counted are the settled ones, as they always were, so no
  // part of this appears over dice still in the air.
  const settled = game?.seats.map((seat) => seat.score) ?? [];
  const counted = useCounts(settled);
  // Every Seat in score order, for the table behind the tap, and the three-row
  // window on to it for the play screen. One ordering, so the two cannot
  // disagree about who is ahead, which is what they used to do.
  const full = game === null ? [] : ranking(game, mySeat, counted);
  const ranked =
    game === null || !board ? [] : leaderboard(game, mySeat, counted);
  // Nothing has settled yet, so there are no scores to show and no Seat to say
  // is rolling. It lasts as long as the tumble a screen opens in the middle of.
  const active = game === null ? null : game.activeSeatIndex;
  // Answers `null` for a Seat nothing is known about yet: not yet known is not
  // the same as away, and neither of them is worth a jump on the screen.
  const presenceOf = usePresence(gameId, secret);

  // Whether it is open is the dialog element's own business, so there is no
  // copy of it here to keep in step: the tap opens it, three things close it,
  // and the `close` event is where focus comes back. `showModal` is what makes
  // it a modal — the top layer, the backdrop, the inert page behind it, Escape,
  // and focus moved inside are all native and none of it is written here.
  //
  // Only the tap opens it. Nothing in the Game may — least of all the end of
  // it, where the Result screen already lists every final score (and unmounts
  // this row with it).
  return (
    <>
      <button
        ref={rowButton}
        type="button"
        aria-haspopup="dialog"
        // A row with nothing settled behind it has no scores to open onto, so
        // the tap is off rather than opening on an empty list. Nothing about
        // the row changes shape for it: the same height, the same »…«.
        disabled={game === null}
        onClick={() => dialog.current?.showModal()}
        // No fill and no edge: on this ground the Seats are one ranked
        // block of type on the page, the way a printed table of results is, and
        // the panel this used to be was the second-largest object on the screen
        // holding three short lines. What makes it a control is what it always
        // was — the chevron, the label read out beside it, and the focus ring.
        // The reserved height is untouched: `--play-board` and `--play-row` are
        // what the fold is measured against, and losing the box does not change
        // what the block has to hold.
        className={`field-live flex w-full flex-col justify-center rounded-tile px-2 text-left ${
          board ? "h-(--play-board)" : "h-(--play-row)"
        }`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="truncate">{turn}</span>
            {/* Presence for the Seat whose Turn it is, because that is the
                question a waiting Player has: is anyone going to move? Never
                for your own Turn — you are the one being waited for, and »Du
                bist am Zug. — gerade da« tells you something you could not fail
                to know. Every Seat's, yours included, is behind the tap. The
                dot keeps its 8px in every state including that one, so the
                row's height never depends on what it has to say. */}
            <PresenceDot
              present={
                active === null || active === mySeat ? null : presenceOf(active)
              }
            />
          </span>
          <span className="flex shrink-0 items-center gap-1 text-muted">
            {/* Your own score counts here too, not only in the list behind the
                tap — the list is shut most of the time, and a Plus/Minus taking
                1000 off you while it is shut is exactly the moment worth
                seeing. Where the leaderboard is showing it is a row of its own,
                so this line carries only what has no row to be in: a Spectator,
                who holds no Seat, and a screen with nothing settled yet. */}
            {(!board || score === null) && standing}
            {!board && game !== null && mySeat !== null && (
              <Counted shown={counted[mySeat]} value={settled[mySeat]} />
            )}
            {/* The label of the control, said only where the text cannot: the
                visible half-row is the news, not the promise of what a tap
                brings. */}
            {/* What used to be here was a bare »›« — a unicode glyph standing in
                for an icon system, pointing at nothing a Player could name. The
                affordance is now the field's own 3:1 boundary plus this, which
                says what the tap opens in the app's own words. The screen-reader
                label stays separate because it is a sentence and this is a
                caption. */}
            <span className="sr-only">— alle Punkte anzeigen</span>
            <span
              aria-hidden
              className="legend text-[0.5rem] whitespace-nowrap"
            >
              alle Punkte
            </span>
          </span>
        </span>

        {/* The leaderboard: the Seat above, you, and the Seat below, by score.
            Ranking is the whole point of these rows, so turn order is not in
            them — it is in the line above and in which buttons are live.
            Keyed by Seat, so a Seat that changes place is the same row that has
            moved rather than a row redrawn with somebody else's name in it —
            which is also the whole of the swap: given the keys and an order
            that has changed, the library measures where each row was and where
            it now is and moves it (`ROW_SWAP`). Nothing here describes that
            movement, and the rows are the only thing making it: the box around
            them is a fixed height, so the screen holds still while they cross.
            Spans and not a list, because everything inside a button has to be
            phrasing content — the rows are read out as part of the label of the
            control that opens the full table, which is what they are. */}
        {ranked.length > 0 && (
          <span className="flex flex-col text-(length:--play-note-text)">
            {ranked.map((row) => (
              <m.span
                key={row.seat}
                // Reduced motion is the same one mechanism it is everywhere
                // else, and here it is the absence of the feature rather than a
                // duration set to nothing: no measuring, no movement. The
                // numbers are already their new values by then, so the rows are
                // simply in their new order.
                layout={!still}
                transition={ROW_SWAP}
                // No band on the active Seat's row any more, and the argument
                // for taking it off is the one that had already taken it off
                // your own row: the line directly above says »Marlene ist am
                // Zug.«, so a reversed row saying »Marlene« said it twice in
                // adjacent lines. It was also the one row inset by its own
                // padding, which in a column of three right-aligned figures put
                // the leader's number 4px out of true with the two under it.
                //
                // So the reversal is spent where nothing else says it: the full
                // table behind the tap, which has no sentence naming the Seat in
                // play. Here the rows are one ranked block in both cases rather
                // than two shapes depending on whose Turn it is.
                className={`flex h-(--play-rank) items-center justify-between gap-2 ${
                  row.you ? "font-semibold" : "text-muted"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {/* The place, printed the way a form numbers its lines — the
                      same `w-3` figure `GameList.tsx` sets its rows with. Not
                      hidden from the accessible tree the way that one is: a line
                      number carries nothing, but standing second in a Game of
                      four is the whole point of ranking the rows. */}
                  <span className="legend w-3 shrink-0 text-[0.55rem]">
                    {row.place}
                  </span>
                  <span className="truncate">{row.you ? "Du" : row.name}</span>
                </span>
                <Counted shown={row.score} value={settled[row.seat]} />
              </m.span>
            ))}
          </span>
        )}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="scores-heading"
        // Escape, the close control and a tap outside all come back through
        // here, so closing is one path however it started — including putting
        // the Player back on the row they left.
        onClose={() => rowButton.current?.focus()}
        // A tap outside it. The dialog element itself is only ever the
        // backdrop, because everything inside it is in the padded box below.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
        // `pop-in` is the arrival, and it is put on only when movement is
        // wanted — the same one mechanism as `.die-tumbling`, which is why
        // there is no `prefers-reduced-motion` block behind it. The dialog
        // still opens itself; nothing here keeps a copy of whether it is open.
        // The full table of scores, and on this ground it is the docket the slip
        // tears off: the stock, a heavy rule round it, and a perforation under the
        // heading. Not a floating panel — nothing on this sheet floats — so there
        // is no shadow and no corner, only the rule that says where the paper ends.
        className={`m-auto w-[min(20rem,calc(100vw-2rem))] rounded-tile bg-stock p-0 text-ink shadow-lift backdrop:bg-ink/40 ${still ? "" : "pop-in"}`}
      >
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-3">
            {/* The docket's own caption, in the legend voice like every other
                field's, rather than a heading in the sheet's reading size. */}
            <h2 id="scores-heading" className="legend flex-1 text-[0.6rem]">
              Punkte
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="legend rounded-control px-2 py-1 text-[0.7rem] underline"
            >
              Schließen
            </button>
          </div>
          {/* The tear line, so the table reads as the part of the slip you keep. */}
          <div className="perf" />
          {/* A reading surface and nothing else: there is nothing to do to a
              Seat from here. Which Seat is rolling is said in words as well as
              in colour, so it survives being read out. */}
          {/* Ranked, and by the same function the three rows on the play screen
              are ranked by (`ranking` in `scoreboard.ts`). This list used to be
              in Seat order, which meant tapping a ranking opened the same four
              numbers in a different order — and the backdrop being only
              `bg-ink/40`, the ranked rows showed through behind it, so both
              orders were on screen together. Turn order is not lost: the »am
              Zug« label below says it in words, which is where it belonged. */}
          <ul className="flex flex-col gap-1">
            {full.map((row) => (
              <m.li
                key={row.seat}
                // The same swap as the rows on the play screen, and now that the
                // list is ranked it needs it for the same reason: several Seats
                // move at once under a Plus/Minus, and rows that jumped to their
                // new places while the block behind this one glided would be the
                // one movement in the app arriving before its cause. It costs no
                // bundle — `domMax` is already loaded for the rows behind (see
                // `App.tsx`) — only the measuring of a list that is usually shut.
                layout={!still}
                transition={ROW_SWAP}
                // The Seat whose Zug it is, reversed out. It used to be
                // `bg-azure/25` — the ink at a quarter alpha, which on this
                // ground is a mid grey that reads as "disabled" rather than as
                // "this one", and which put quiet type on an unmeasured surface.
                // Quiet is said in a colour here and loud is said by inverting.
                //
                // This is now the only place the reversal marks the active Seat:
                // the collapsed rows gave it up because the sentence above them
                // already named the Seat in play, and there is no such sentence
                // in here.
                className={`flex items-center justify-between gap-3 rounded-tile p-3 ${
                  row.seat === active ? "reversed font-bold" : "field"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {/* The place, as on the rows behind. */}
                  <span className="legend w-3 shrink-0 text-[0.55rem]">
                    {row.place}
                  </span>
                  <span className="truncate">
                    {row.name}
                    {/* Which of these is you, on a table of names you chose
                        yourself. */}
                    {row.you && <span className="font-normal"> (du)</span>}
                  </span>
                  {/* The full picture: every Seat, present or away. */}
                  <PresenceDot present={presenceOf(row.seat)} />
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {row.seat === active && (
                    // The reversed row's quiet tone. `--color-muted` is 2.77:1 on
                    // the ink and fails AA; this is 4.91:1, the same value the
                    // marked hand-cell's own number uses, so the sheet has one
                    // quiet-on-ink tone rather than two.
                    <span className="text-xs font-normal text-[#7d888c]">
                      am Zug
                    </span>
                  )}
                  {/* Several of these move at once under a Plus/Minus, which
                      is the whole character of that Card: it pays the Player
                      1000 and docks every Seat in the lead. Watching them all
                      fall together is the thing to see — and they fall on the
                      one clock the rows outside this dialog are on, so this
                      list costs no count of its own however many Seats it has
                      in it. */}
                  <Counted shown={row.score} value={settled[row.seat]} />
                </span>
              </m.li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

/**
 * The hand still to be thrown: dashed places while it waits, and real cubes
 * turning once somebody at the table has »Würfeln« held down.
 *
 * A component of its own for the same reason the scoreboard is one. The wind-up
 * has to be able to time out — a phone that locked mid-hold sends no last word —
 * and time passing is not something a Convex query is re-run for, so a clock
 * ticks here (ADR 0006). Read in `Game` it would tick the whole play screen
 * every few seconds: the Card, the »Herausgelegt« row, the pile, the Roll on
 * the table. Read here it ticks six dice that are already the only thing it can
 * change, and the promise `usePresence.ts` makes — that these clocks re-render
 * their own row and nothing else — stays true.
 *
 * Nothing about a turning die is a result. There is no Roll yet, so it has no
 * face, shows none for long enough to read and is not read out; the only thing
 * the hold changes is how fast it goes round.
 *
 * The box is the same box the dashed place held — `.die` reserves the full
 * sweep a cube needs and `.die-blank` sits centred in exactly that — so the grid
 * does not move when the dice start, and no die can paint over its neighbour
 * however fast it is turning.
 */
function Hand({
  slots,
  faceClass,
  grid,
  gameId,
  activeSeatIndex,
  still,
  thrown,
  mine,
}: {
  /** How many dice are still in the hand. */
  slots: number;
  faceClass: string;
  /**
   * The dice grid: the one element the wind-up's angle is written onto, for the
   * whole hand to read out of two custom properties.
   */
  grid: RefObject<HTMLDivElement | null>;
  gameId: Id<"games">;
  activeSeatIndex: number;
  /** This Player has asked for no movement. */
  still: boolean;
  /** A Roll is on the table, so whatever was wound up has arrived. */
  thrown: boolean;
  /** This device's own hold, which starts under its own thumb. */
  mine: number | null;
}) {
  // The hold the table reports, which is how a waiting Player and a Spectator
  // see the dice turning at all — the same subscription the scoreboard's
  // presence dots come off. What it carries is when, never how far: there is no
  // how far, and showing one would be showing a number about nothing.
  const table = useWinding(gameId);
  const since = spinningSince({
    still,
    thrown,
    mine,
    table,
    activeSeatIndex,
  });
  useSpin(grid, since);
  return (
    <>
      {Array.from({ length: slots }, (_, index) =>
        since === null ? (
          <div
            key={`hand-${index}`}
            // `rounded-tile` and not `rounded-control`: a control on the Papier
            // ground is a pill, and a die still to be thrown wearing that came out
            // a circle. This is a die's own corner, the same one the dice have.
            className="die-blank placeholder rounded-tile"
          />
        ) : (
          <Die
            key={`hand-${index}`}
            // Unread and unreadable: the cube is turning, and which side is up
            // comes from the angle rather than from this. A die that is *not*
            // turning would both rest on this face and say it out loud, which
            // is why `spinningSince` answers `null` under reduced motion and
            // this branch is never reached there.
            face={1}
            index={index}
            plays="spin"
            faceClass={faceClass}
          />
        ),
      )}
    </>
  );
}

/**
 * The dice out of play, and the dice arriving. Setting dice aside is the moment
 * they leave the hand, so it is the moment they move: choosing one is only a
 * decision, and a decision can be taken back.
 *
 * The flight is a replay, like the tumble and like the draw (ADR 0001) — the
 * server has already taken the dice off the table by the time anything here
 * moves, and the whole of it is one measured offset per die. Nothing about the
 * outcome is in it: a die on its way says only that it is out of play.
 *
 * A watching phone runs exactly this code off exactly this subscription. It
 * never saw the selection, only the row growing, which is why a landed die is
 * matched to a hand die by its face.
 */
function SetAsideRow({
  faces,
  sweep,
  roll,
  grid,
}: {
  /**
   * The row, oldest first — and only ever appended to or emptied whole. The
   * reducer adds a set-aside selection with `[...turn.setAside, ...chosen]`,
   * and a TUTTO, a Niete and a Stop-Karte each replace the lot with `[]`.
   * Nothing edits or reorders a die already in it.
   *
   * That is what lets the count below stand in for identity: if the row is one
   * longer than the flights already worked out, the extra dice are on the end
   * and they are the ones that have just landed. Were a die ever replaced in
   * place, the count would not move and its flight would never be worked out —
   * silently, because the berths are keyed by index and `initial` only applies
   * on mount, so the die would simply appear where it belongs. Nothing would
   * look broken; the animation would just stop happening.
   *
   * Within one »herauslegen« the order is the table's, left to right, because
   * that is the order `inTableOrder` sends a selection in. One act of setting
   * aside has one place in the row's order, so there was nothing between those
   * dice to record — and it is what keeps their flights from crossing.
   *
   * Which position each one comes from is decided where both are in hand, in
   * `Game`.
   */
  faces: Face[];
  /**
   * These dice are forfeit, so the row emptying is a loss and is shown as one.
   * `false` is every other way a row empties — a TUTTO handing the six dice
   * back, a Feuerwerk's Niete paying out — where the dice are simply gone, as
   * they have always been.
   */
  sweep: boolean;
  /** The Roll on the table, or empty once it has been rolled away. */
  roll: Face[];
  /** The dice grid, which is where these dice have just come from. */
  grid: RefObject<HTMLDivElement | null>;
}) {
  const still = useReducedMotion();
  // Where the hand was. Kept in a ref rather than measured on demand, because
  // by the time a die is in this row its place in the grid is already gone.
  const hand = useRef<HandDie[]>([]);
  const berths = useRef<(HTMLDivElement | null)[]>([]);
  // One flight per die that has landed, in the row's order — and the count of
  // them is how many dice this row has already seen, so there is no second
  // copy of the length to keep in step.
  const [flights, setFlights] = useState<FlightStart[]>([]);

  // After layout and before paint, so the first frame a new die is painted in
  // is already the frame it takes off from, exactly as the drawn Card's is.
  useLayoutEffect(() => {
    // Only while a Roll is on the table: the render that adds a die to this row
    // is the render the Roll is cleared in, so the measurement has to be the
    // one taken before it.
    //
    // A Roll on the table is also what makes the grid's nth child the nth die.
    // The grid holds the Roll's dice or the placeholders, never both — the
    // placeholders are rendered only when `turn.roll === null`, which is
    // exactly when this arrives empty — so a non-empty Roll needs no second
    // check that what is in there is dice.
    const dice = grid.current?.children;
    if (roll.length > 0 && dice !== undefined) {
      hand.current = roll.map((face, index) => ({
        face,
        rect: dice[index].getBoundingClientRect(),
      }));
    }

    // The count of flights already worked out is where the row was, so this
    // asks for the flights of the dice past it and hands back what it was given
    // when there are none — which is React's own way of saying nothing changed,
    // and what keeps this from rendering in a circle.
    setFlights((flown) => {
      if (faces.length === flown.length) return flown;
      // A TUTTO or a Niete empties the row; nothing flies back out of it.
      if (faces.length < flown.length) return flown.slice(0, faces.length);
      const landed = faces.slice(flown.length);
      return [
        ...flown,
        ...takeoffs(
          landed,
          // Reduced motion is a hand with nothing in it: the same path a phone
          // takes when it never saw the Roll, and so one mechanism, not two.
          still ? [] : hand.current,
          landed.map(
            (_, index) =>
              berths.current[flown.length + index]?.getBoundingClientRect() ??
              null,
          ),
        ),
      ];
    });
  }, [faces, roll, grid, still]);

  // Forfeited dice leave the table; every other row empties in no time at all,
  // which is what a TUTTO has always looked like. Reduced motion is the second:
  // the same hook the dice, the Card and the settled position ask, so the news
  // and the emptied row arrive together with nothing moving in between.
  const swept = sweep && !still;

  return (
    <div>
      {/* Lower case and italic, which is what a printed aside looks like: this
          names a row of dice that are finished with, and it was set as a heading
          over them in a voice louder than the row it labels. A real italic is one
          of the things the ground's serif brought with it. */}
      {/* A field's caption, not an aside. It used to be lower-case italic, which
          was the Papier serif's own voice — and this sheet's face ships no
          italic, so the browser was synthesising an oblique out of a grotesk,
          which is the one thing a self-hosted face is supposed to stop. It is the
          legend voice now, like every other caption in the app, and it names the
          field below whether or not anything is in it yet. */}
      <div className="legend pt-(--play-pad) pb-1 text-(length:--play-note-text)/(--play-note)">
        Herausgelegt
      </div>
      {/* Set aside and out of play: smaller, set apart, and never rerolled.
          These never tumble, so they need no room to sweep through and their
          box is just the die.

          The felt is here for the same reason it is under the hand, and it was
          missing: a white die on the page is 1.15:1, which `--color-felt`'s own
          comment calls a hole rather than an object, against 1.35:1 on felt.
          These are the smallest dice on the screen and they were the ones with
          no table under them.

          It costs no height. The felt is flush to the row rather than padded —
          the row keeps `--play-set-aside` exactly, empty or full, so the fold
          budget does not pay for this. What it buys is a ground in the gaps
          between the dice and to the right of the last one, which is where the
          row stops reading as a gap.

          Not dimmed, and that is measured rather than left undone. The comment
          here used to promise »darker« and no code ever did it; the obvious
          repair was to make the promise true, using the played pile's device at
          a lighter value. It cannot be had. A die dimmed even to 0.94 reads
          1.19:1 against the felt — under the 1.3 this row was fixed to clear,
          and barely above the 1.15 hole it was fixed *from*. The largest dim
          that still clears the floor is 1.8%, which is nothing anybody sees.
          The dim and the ground want the same contrast and only one of them can
          have it, so the ground wins: it is the one a Player needs.
          Out-of-play is already said twice over anyway, by the label above the
          row and by the size. */}
      <div className="field flex min-h-(--play-set-aside) flex-wrap items-center gap-(--play-set-aside-gap) rounded-tile px-2 [--die-box:var(--play-set-aside)] [--die-size:var(--play-set-aside)]">
        {/* A die leaving the row is a thing to watch when it is forfeit, so the
            row's dice outlive their removal from the position long enough to be
            seen going. Nothing else about the row changes: the berths hold the
            same places for as long as they are there, and the row holds one
            fixed height empty or full — whatever height this screen can afford
            it — so nothing below it moves either way. */}
        <AnimatePresence>
          {faces.map((face, index) => (
            // The place in the row is held whether or not the die in it is
            // ready to be drawn, so a die arriving neither moves the row nor
            // resizes it. It is also what the flight is measured to.
            <m.div
              key={index}
              ref={(element) => {
                berths.current[index] = element;
              }}
              className="die-berth"
              // Swept off together — one offset for all of them, so no die
              // crosses another and the paint-order bug that looked like
              // clipping stays fixed. `motion.ts` carries the rest of that
              // argument, and the distance with it.
              exit={swept ? { x: SWEEP_X, opacity: 0 } : { opacity: 0 }}
              transition={{
                duration: swept ? SWEEP : 0,
                ease: SWEEP_EASE,
              }}
            >
              {index < flights.length && (
                <m.div
                  // The offset it starts at and nothing else — no scale, and
                  // this is the end of the seam where that costs something. The
                  // die leaves a box nearly three times the width of the berth
                  // it lands in, so scaling it would be the realistic choice:
                  // it would take off at the size it really was. It would also
                  // sweep over the dice either side of it, and `.die`'s
                  // perspective makes a die painted over by its neighbour look
                  // clipped rather than overlapped — the paint-order bug a
                  // previous fix traced and settled. So the die travels at the
                  // size it lands at: the reserved room is the room, in flight
                  // as at rest.
                  initial={flights[index]}
                  animate={{ x: 0, y: 0 }}
                  // A spring, and so a die that reaches its berth and settles
                  // into it. The bounce is the small one on purpose: these
                  // berths are pinned to the die with only the row's gap
                  // between them, so the overshoot has to be smaller than that
                  // gap or the paint-order bug is back. `motion.ts` carries the
                  // arithmetic. The duration is the flight's, unchanged, so the
                  // news still waits exactly as long as it did.
                  transition={DIE_LANDING}
                >
                  {/* Out of play, and still a die: a grey one, with the same
                      ink pips every other die on this table has, so only the
                      ground says which of the three states it is in — white in
                      the hand, azure picked up, grey spent. It used to be drawn
                      on the lifted surface, which was a shade of a plum page
                      and is very nearly nothing on a charcoal one; what has
                      already happened is worth being able to read. */}
                  <Die
                    face={face}
                    index={index}
                    plays="nothing"
                    // Out of play, and still a die. On this ground that is not a
                    // grey fill: it is the same printed die drawn in the rule
                    // grey, outline and pips together — `.die-face` takes both
                    // from `currentColor`, so a spent die is the one that has had
                    // its ink taken out of it.
                    // The box quiet, the value at full ink: `.die-spent` splits
                    // the outline off `currentColor` so a spent die stays legible.
                    faceClass="die-spent bg-stock text-ink"
                  />
                </m.div>
              )}
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * The Roll on the table, and which of it has been picked up — on every phone at
 * the table, not only the one doing the picking. Reaching for a fourth die and
 * putting it back is the most interesting part of somebody else's Turn, and it
 * used to happen off screen.
 *
 * The two halves of the selection are read here and nowhere else, for the same
 * reason presence is read in the scoreboard row: a tap on the active Player's
 * phone re-renders this grid and leaves the Card, the row and the position
 * alone. Nothing is written to the Game document, so nothing here can restart a
 * tumble or move the news along.
 *
 * The Player choosing renders from their own state — the die is blue in the
 * frame it was tapped in, whatever the network is doing — and publishing is a
 * side effect that happens beside it. Everyone else renders what arrived.
 */
function DiceGrid({
  game,
  gameId,
  secret,
  choosing,
  selected,
  onToggle,
  handSlots,
  grid,
  still,
  holdSince,
  wound,
}: {
  /**
   * The live position. These dice are the animation and not its outcome, and
   * picking one up gives nothing away, so the grid does not wait for the news.
   */
  game: GameState;
  gameId: Id<"games">;
  /** This device's proof of its Seat (ADR 0004), or `null` if it holds none. */
  secret: string | null;
  /** Whether this device is the one choosing: its Turn, and the phase for it. */
  choosing: boolean;
  /** What this device has picked up, on the device that is picking. */
  selected: number[];
  onToggle: (index: number) => void;
  /** How many dashed places the hand still has, if any. */
  handSlots: number;
  grid: RefObject<HTMLDivElement | null>;
  /** This Player has asked for no movement. */
  still: boolean;
  /** This device's own hold, which starts under its own thumb. */
  holdSince: number | null;
  /**
   * The wind-up this Roll arrived on, which outlives it by exactly long enough
   * for the tumble to carry on from where it left the dice.
   */
  wound: number | null;
}) {
  const rolled = game.turn.roll ?? [];
  // The one name for this Roll, and the two things that need one both take it
  // from here: which selection a published row belongs to, and how the dice of
  // this throw came down. A second way of naming a Roll is a second way of
  // getting it wrong.
  const roll = rollKey(game);
  usePublishSelection(gameId, secret, choosing, roll, selected);
  // Every Seat's last word. The chooser's own screen never reaches for it —
  // `chosenDice` takes their hand instead — so this arriving late, or not at
  // all, costs them nothing.
  const published = usePublishedSelections(gameId);
  const picked = chosenDice(choosing ? selected : null, published, game);

  return (
    // No gap: each die's box already reserves the room its cube sweeps
    // through, and that reserved room is the space between them.
    // Always two rows, whatever is in them. Six dice fill two rows and three
    // fill one, so a grid that sized itself to its contents would lift the
    // set-aside row and both button slots by a whole `--die-box` the moment
    // the Player set a die aside. Two rows is what the tallest case needs
    // anyway, so reserving them costs nothing.
    <div
      ref={grid}
      // The slip's marked field: six cells in a ruled 3×2 block, which is what a
      // betting slip is and what six dice have always wanted to be. The rules are
      // drawn by the cells themselves (`.hand-cell`) rather than by a border on
      // this box, so every die sits *in* a box the way a mark does — and the
      // grid's outer edge comes from the same rules meeting.
      //
      // `justify-items-stretch`, not centre: a cell is the full width of its
      // column, because a printed box does not shrink to its contents. The die
      // still centres inside it, and each die's box still reserves the room its
      // cube sweeps through, so the paint-order bug that looked like clipping
      // stays fixed.
      className="hand-field grid grid-cols-3 grid-rows-[repeat(2,var(--die-box))]"
    >
      {rolled.map((face, index) => {
        // Any die may be picked up. A selection that scores nothing is
        // refused at »herauslegen«, by the same function the server
        // validates with — so nothing here has to know which dice score.
        // The live phase, not the settled one: picking a die up is the
        // Player's own decision and gives nothing away, so a Player who has
        // already made up their mind may do it while the dice still turn.
        // Committing is what waits, because that is where the news is.
        const isChosen = picked.has(index);
        return (
          <button
            key={`${rolled.join("")}-${index}`}
            type="button"
            disabled={!choosing}
            aria-pressed={choosing ? isChosen : undefined}
            onClick={() => onToggle(index)}
            // The cell is the control, and the whole cell: a printed box is hit
            // anywhere inside it, which on a phone turns six die-sized targets
            // into six column-wide ones at no cost to the fold.
            className={`hand-cell ${isChosen ? "hand-cell-marked" : ""}`}
          >
            {/* The cell's number, printed in the corner in dropout ink the way a
                slip numbers its boxes. It is the die's place in the hand and
                nothing else — the face is the die's, and a number here that could
                be read as a value would be a second number on the same object.
                So it is small, in the grid's own ink, and hidden from a screen
                reader, which is already told the face by `Die`. */}
            <span aria-hidden className="hand-cell-index">
              {index + 1}
            </span>
            <Die
              face={face}
              index={index}
              // Square in its cell, which is why neither `tiltDegrees` nor
              // `nudgePercent` is imported here any more. Both existed to make a
              // Roll read as thrown rather than laid out: the first turned each
              // die a few degrees off true, the second brought it down off the
              // centre of its box. That is a rendered-object cue, and on a ruled
              // form a mark sits square in the middle of its cell.
              //
              // The tilt had a second cost that was not a matter of taste. It
              // was the other source of the doubled outline: off axis, the
              // cube's side faces reached past the front face's edge. The nudge
              // never did that, being a translation, and it goes for the ground's
              // reason alone.
              //
              // `dice.ts` keeps both functions and their tests as the record of
              // how the angle and the offset were derived, in case a future
              // ground wants a thrown hand again.
              tilt={0}
              plays="tumble"
              wound={wound}
              faceClass={isChosen ? chosen : inHand}
            />
            {/* On a watching phone the blue is the whole of the news and there
                is no `aria-pressed` to carry it, because there is nothing here
                to press. So it is said, the way the presence dot says its
                colour. */}
            {!choosing && isChosen && (
              <span className="sr-only"> — ausgewählt</span>
            )}
          </button>
        );
      })}
      {/* The hand still to be thrown — the dice are in it either way, and the
          wind-up is the moment they are picked up rather than a new thing
          appearing. A leaf of its own, so the clock it holds ticks these dice
          and nothing above them. */}
      <Hand
        slots={handSlots}
        faceClass={inHand}
        grid={grid}
        gameId={gameId}
        activeSeatIndex={game.activeSeatIndex}
        still={still}
        thrown={game.turn.roll !== null}
        mine={holdSince}
      />
    </div>
  );
}

/**
 * The play screen taking the blow: one short jolt, once, when a Niete has taken
 * the Turn. It is the third of the three things a loss is made of — the »Im
 * Zug« score draining away and the row being swept are the two that say *what*
 * was lost — and on its own it would only say that something bad had happened.
 *
 * `translateY` and nothing else, so it costs no layout: this screen has paid
 * for fixed heights everywhere precisely so that nothing moves under a thumb
 * already on its way down, and a jolt that reflowed the page would spend all of
 * that. Up first, because down is where the screen has no room to give — the
 * reason is in `motion.ts` with the number.
 *
 * It fires from the settled position, so it lands with the last die and with
 * the line that says so, and a Player watching sees it off the same
 * subscription at the same point. Reduced motion gets no jolt at all, through
 * the one hook the rest of the screen asks.
 */
function Jolt({ struck, children }: { struck: boolean; children: ReactNode }) {
  const still = useReducedMotion();
  // The blow is an event, and `struck` is a state that stays true until the
  // next Turn. So the jolt is started rather than declared: this is the edge
  // between the two, and it is what keeps a Turn that has already died from
  // shaking the screen on every render. Nothing here is held in React state —
  // the screen's position does not change because it was hit, and a jolt is
  // over before the next thing the Player could do.
  const jolt = useAnimationControls();

  useEffect(() => {
    if (!struck || still) return;
    void jolt.start({ y: JOLT_Y, transition: { duration: JOLT } });
  }, [struck, still, jolt]);

  return (
    // The play column itself, so the jolt moves the whole table and not a part
    // of it. Eight gaps down it, all of them off `--room` in `index.css`: air
    // is the first thing the screen gives when it is short, and eight of
    // anything adds up. Everything below sits in a slot of a fixed height, so
    // what changes between taps is what is in a slot and never where it is —
    // and the jolt is a `transform`, so it does not spend any of that.
    // `safe center` and not `center`: the whole composition is centred in whatever
    // height the screen has spare, which on the phone this screen is measured for is
    // none — so it changes nothing there and costs the fold nothing. On anything
    // taller it is what stops the table being a strip of content with a button
    // stranded at the bottom of an empty page.
    //
    // Centred *once*, around everything, and that is the load-bearing half. The
    // table used to take the spare height and centre itself inside it, which put
    // slack above and below the dice — so any height change anywhere in the column
    // moved them by half of it and a tap shifted the table. Here the stack is rigid
    // and only the block as a whole is placed.
    //
    // `safe` is the overflow case: plain `center` on a container whose content is
    // taller than it splits the overflow both ways and puts the top out of reach,
    // because you cannot scroll above a flex line. `safe` falls back to packing at
    // the start exactly then. The screen only overflows below 558px of viewport,
    // which is shorter than any phone in portrait, but a screen that cannot be
    // scrolled to the top of is worse than one that is merely tall.
    <m.div
      className="flex flex-1 flex-col gap-(--play-gap) [justify-content:safe_center]"
      animate={jolt}
    >
      {children}
    </m.div>
  );
}

/**
 * The value axis: a Seat's banked score and the Turn's stake, as one length.
 *
 * Both are clamped and the stake is clipped to whatever room is left, so a Turn
 * worth more than the remaining distance to 6000 fills the axis rather than
 * overflowing it — which happens often, since a Straße is worth 2000 and a
 * doubled Turn can be worth far more than that.
 *
 * `aria-hidden`, and that is deliberate rather than lazy: every number on it is
 * already read out in words directly above (the Seat's score in the turn field,
 * the Turn's stake under »Im Zug«), so announcing it again would make a screen
 * reader say the same two figures three times. It is a second *encoding* of
 * information already present, which is what a graphic on a form is for.
 */
function ValueAxis({ banked, stake }: { banked: number; stake: number }) {
  const safe = Math.max(0, Math.min(banked, FINAL_ROUND_SCORE));
  const bankedPct = (safe / FINAL_ROUND_SCORE) * 100;
  // The stake takes what is left of the axis and no more.
  const stakePct = Math.max(
    0,
    Math.min((stake / FINAL_ROUND_SCORE) * 100, 100 - bankedPct),
  );
  return (
    // A labelled field, not a bare track. Unlabelled it read as a divider rule
    // between the Card row and the turn field, which is what a 3px line with
    // nothing on it looks like; the legend is what makes it a scale on this sheet,
    // and it names the domain so the sliver a small Zug occupies is legible as a
    // proportion rather than as a smudge.
    <div aria-hidden className="flex items-center gap-2">
      <span className="legend shrink-0 text-[0.5rem]">bis 6000</span>
      <span className="value-axis rounded-tile flex-1">
        <span
          className="value-axis-banked"
          style={{ width: `${bankedPct}%` }}
        />
        {stakePct > 0 && (
          <span
            className="value-axis-stake"
            style={{ left: `${bankedPct}%`, width: `${stakePct}%` }}
          />
        )}
      </span>
    </div>
  );
}

/** The end of the Game: who won, and what everyone finished on. */
function Result({
  game,
  abandoned,
  onBack,
}: {
  game: GameState;
  abandoned: boolean;
  onBack: () => void;
}) {
  const { seats } = game;
  const won = winners(game);
  const names = won.map((index) => seats[index].name).join(" und ");
  // A Kleeblatt wins from any score, so the standings below will not explain
  // it — it is the one ending that has to say why it happened.
  const cloverleaf = !abandoned && game.turn.phase === "won";
  // Four endings and they do not read alike. Walking away is the quiet one:
  // final scores, nobody named, and it stays out of the record entirely.
  const tile = abandoned ? TILE.loss : TILE.win;

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* The moment. A Game of Tutto can run for days and the whole of it is an
          argument about who won, so the winner's name is the largest thing on
          the screen and wears the crown that means exactly that everywhere else
          in the app. */}
      {/* The result, stamped. A Game can run for days and the whole of it is an
          argument about who won, so this is the one place on the sheet that is
          fully reversed out — the loudest thing this ground can do without
          inventing a colour, which is what the win tile used to be doing.
          Abandoned takes the same stamp and says »Kein Sieger« in it: the ending
          is quiet in *what it says*, not in how the sheet prints it, and the old
          pink-versus-amber pair was a hue carrying a distinction the words carry
          better. */}
      <div className="reversed flex flex-col items-center gap-2 rounded-tile p-6 text-center">
        <MarkWell
          name={cloverleaf ? "clover" : tile.mark}
          className="h-14 w-14 bg-stock text-3xl text-ink"
          label={abandoned ? "Abgebrochen" : "Gewonnen"}
        />
        <div className="legend text-[0.55rem]">
          {abandoned
            ? "Spiel abgebrochen"
            : won.length === 1
              ? "Gewinner"
              : "Unentschieden"}
        </div>
        <div className="font-display text-3xl font-extrabold [font-stretch:104%]">
          {abandoned ? "Kein Sieger" : names}
        </div>
        {/* Said only where it is true, and it is true once in fifty-six. */}
        {cloverleaf && (
          <div className="text-sm font-semibold text-[#7d888c]">
            Kleeblatt — zwei TUTTOs hintereinander
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {seats.map((seat, index) => {
          // The winner's row is distinct from the rest, and on an abandoned
          // Game no row is: nobody won it.
          const winner = !abandoned && won.includes(index);
          return (
            <li
              key={index}
              className={`flex items-center gap-3 rounded-tile p-3 ${
                winner ? "reversed" : "field"
              }`}
            >
              <MarkWell
                name={winner ? "crown" : "person"}
                // On a reversed row the mark's box is the stock with the ink in
                // it, which is the inversion carried through rather than a second
                // colour introduced to mark the winner.
                className={winner ? "bg-stock text-ink" : TILE.player.well}
              />
              <span className="min-w-0 flex-1 truncate text-lg font-semibold">
                {seat.name}
              </span>
              <span className="receipt text-xl font-bold">{seat.score}</span>
            </li>
          );
        })}
      </ul>
      <button className={`${primary} mt-auto`} onClick={onBack}>
        Zurück zur Übersicht
      </button>
    </div>
  );
}

export function Game({
  gameId,
  secret,
  onSeated,
  onBack,
}: {
  /** Straight from the address bar, so not necessarily a Game that exists. */
  gameId: string;
  /**
   * This device's proof of its Seat in this Game (ADR 0004), or `null` for a
   * device holding none — every move carries it, and the server refuses the
   * ones it does not recognise.
   */
  secret: string | null;
  onSeated: (gameId: string, secret: string) => void;
  onBack: () => void;
}) {
  const game = useQuery(api.games.get, { gameId });
  // What the screen may say about that position yet. The dice, the Card and the
  // pile are the animation and arrive live; everything that reports an outcome
  // waits here until the animation showing it has finished.
  const settled = useSettled(game);
  // Which Seat this device holds here, if any. The server answers it, because a
  // secret left over from a Game that is gone proves nothing.
  const heldSeat = useQuery(
    api.games.heldSeat,
    secret === null ? "skip" : { gameId, secret },
  );
  const drawCard = useMutation(api.games.draw);
  const roll = useMutation(api.games.roll);
  const setAside = useMutation(api.games.setAside);
  const stop = useMutation(api.games.stop);
  const abandon = useMutation(api.games.abandon);
  const [selected, setSelected] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  // Walking away cannot be undone, so it takes a second tap.
  const [abandoning, setAbandoning] = useState(false);
  // The pile, so a drawn Card can measure where it is flying from. It sits
  // beside the slot in the stat row now, so the flight is a short sideways hop
  // — measured, like every other layout, rather than written down here.
  const pile = useRef<HTMLElement>(null);
  // The dice grid, so a die set aside can measure the place it is leaving —
  // and, while »Würfeln« is held, the one element the wind-up's angle is
  // written onto for the whole hand to read.
  const grid = useRef<HTMLDivElement>(null);
  const windUp = useMutation(api.presence.winding);
  // The one hook the whole app decides movement with. Here it decides whether
  // there is a wind-up at all: a Player who asked for no movement presses the
  // button and simply gets their Roll.
  const still = useReducedMotion() === true;
  // The Roll on the table, keyed as the dice grid keys it. Dice on the table
  // are what ends the wind-up — whatever was being turned on nothing has
  // arrived — and the key is also what the hold is handed over on, so the
  // tumble that mounts can carry on from where it left the dice.
  const rollOnTable =
    game === null || game === undefined ? "" : (game.turn.roll?.join("") ?? "");

  /**
   * Throw them. The mutation is sent on release and the server chooses the
   * faces inside it, from exactly the source it always has (ADR 0001) — how
   * long the button was held is not an argument here and is not an argument
   * there, which is the whole of why a ten-second wind-up and a tap have the
   * same odds.
   */
  const throwDice = () => {
    if (game === null || game === undefined) return Promise.resolve();
    setSelected([]);
    setFailed(false);
    return roll({ gameId: game._id, secret: secret ?? "" }).catch(
      (error: unknown) => {
        setFailed(true);
        // Rethrown because the wind-up is listening for it: the dice are not
        // coming, so they must not go on turning while nothing arrives.
        throw error;
      },
    );
  };

  /**
   * Tell the table a thumb is down, or that the Roll it was winding up for has
   * landed. Nothing waits on it and a Player loses nothing if it never arrives:
   * it only starts and stops the dice on everybody else's screen.
   */
  const wind = (holding: boolean) => {
    if (game === null || game === undefined || secret === null) return;
    void windUp({ gameId: game._id, secret, holding }).catch(() => {});
  };

  const hold = useHold({
    still,
    // The last word is sent once the dice are on the table rather than on
    // release, so a watching phone never stops its dice a round trip before
    // the real ones arrive.
    throwDice: () => throwDice().finally(() => wind(false)),
    wind: () => wind(true),
    roll: rollOnTable,
  });
  // Whether the hand is turning, and on whose hold, is `Hand`'s own question:
  // it is the only thing on the screen the answer changes, and the clock that
  // times a wind-up out belongs beside what it can move.

  if (game === undefined)
    return <p className="text-center text-muted">Lädt …</p>;
  // A link to a Game that never existed, or one typed wrong: say so plainly.
  if (game === null) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-center text-xl text-muted">
          Dieses Spiel gibt es nicht.
        </p>
        <button className={`${primary} mt-auto`} onClick={onBack}>
          Zurück zur Übersicht
        </button>
      </div>
    );
  }
  // The settled position: everything the screen *says*. One event behind the
  // true one for as long as the dice are in the air, and `null` on a screen
  // that has just opened on a Roll it has not yet shown landing — which is not
  // the same as a Turn with nothing to report, so it says nothing at all.
  const said = settled.position;

  // How the Game ended decides when the screen may say so.
  //
  // Walking away is not an outcome anyone is watching dice for, so it is the
  // one ending that does not wait: the Game is over the moment a Player says
  // so, whatever else is on the screen.
  //
  // Every other ending is news, and the largest piece of it the app has — this
  // screen replaces the play screen outright and names a winner, so the Roll
  // that won would never be seen at all. So it goes up on the settled position,
  // which is the frame the last die lands in: the Seat that rolled it has
  // already watched it settle, and a watching phone one event behind holds the
  // dice on screen for exactly as long as it still owes them.
  const ended = game.abandoned ? game : said?.phase === "over" ? said : null;
  if (ended !== null) {
    return <Result game={ended} abandoned={game.abandoned} onBack={onBack} />;
  }
  // Nobody has rolled anything yet: the Game is still filling its Seats.
  if (game.phase === "lobby") {
    return <Lobby game={game} secret={secret} onSeated={onSeated} />;
  }

  const { turn, _id: id } = game;
  const mine = secret ?? "";
  // No Seat — a Spectator, or a device still waiting on the answer. Either way
  // it is offered nothing, which is also what the server would allow it.
  const mySeat = heldSeat ?? null;
  // Whose Turn it is is the rule; the buttons follow it rather than guess, so
  // nothing is ever offered that the server would refuse.
  const myTurn = mySeat !== null && seatMayPlay(game, mySeat);
  // What the deck is, this tap: the draw that starts a Turn, the draw the Seat
  // up next may make on a Turn that is over, the »weitermachen« that rolls on
  // after a TUTTO — or nothing, for a Seat waiting its Turn and for a
  // Spectator. `deck.ts` holds all four and the words for them, and takes both
  // positions for the reason every move on this screen does: whose Turn it is
  // is a rule and comes off the live one, what the Turn is waiting for is news
  // and comes off the settled one. The Seat up next is settled for the sharper
  // version of that — the Turn ahead ends on a Niete the moment the dice are
  // thrown, and a deck lighting up there would announce the outcome while this
  // Player's screen still shows six dice in the air.
  const deck = deckMove(game, said, mySeat);
  // The live position, and only the things that *are* the animation: the Roll
  // on the table, the Card in the slot, the pile it came off, and the dice the
  // Player may pick up while they are still turning. Holding any of these back
  // would be holding back the very thing the news is waiting for.
  const rolled = turn.roll ?? [];
  // Live too, and deliberately so, though it is a number and not a movement: a
  // Card leaving the deck is honest — the Player watched it go — and the count
  // cannot say *which* Card left, because the deck is counts and nothing else
  // (ADR 0003). The played pile's depth is this same number read the other way
  // round, so it is as live and as silent.
  const left = cardsLeft(game.deck);
  // The two faces on the pile, both live. The Card on top is the one the draw
  // is flying in and is what the flight is there to reveal. The Card under it
  // is live for the opposite reason: it is the Card the draw just replaced, its
  // leaving is not news — you already knew what it was — so it settles onto the
  // pile at once, while the new one is still face-down in the air.
  const onTop = cardOnTop(turn, game.lastCard);
  const beneath = cardBeneath(turn, game.lastCard);
  const picking = turn.phase === "awaitingSetAside";

  const choosing = said?.turn.phase === "awaitingSetAside";
  const deciding =
    said?.turn.phase === "awaitingCard" || said?.turn.phase === "awaitingRoll";
  const over = said !== null && !choosing && !deciding;
  const message = said === null ? null : turnMessage(said.turn);
  // The Card the sentence below the table may name. You learn which Card you
  // drew by watching it turn over, so the sentence is the settled Turn's Card:
  // reading it off the live one spells the Card out in plain German 780ms
  // before the flip that was supposed to reveal it, leaving the flip nothing to
  // show. Same Card as the pile above, one draw behind it.
  const explained = said === null ? null : cardInForce(said.turn);
  const stoppable = said !== null && canStop(said);
  // A Niete has taken the Turn's winnings, and this is the moment the Player
  // finds out: the dice have landed and the line says so, so the loss may be
  // shown. Read off the settled position for that reason, and the same for
  // everyone — the Seat that rolled it, a Seat waiting, a Spectator.
  const struck = said !== null && forfeitedToANull(said.turn);
  // Live, because it is the row's own dice going: by the time the settled
  // position says the row is empty there is no Card left in it to ask. It gives
  // nothing away — it is only ever read by dice on their way off the table.
  const forfeit = forfeitedToANull(turn);
  // The row grows on the live position — a die set aside is on its way there
  // and the news already waits for its flight — and empties on the settled one,
  // because an emptied row is news: it is the Turn's winnings gone. While the
  // Roll that took them is still turning, the settled position is still the one
  // that had them, so that is where the row reads them. No copy of the row is
  // kept for this: `useSettled` is already holding the position from before the
  // blow, which is the whole reason it exists.
  const inTheRow =
    turn.setAside.length > 0 ? turn.setAside : (said?.turn.setAside ?? []);
  // The hand, dashed. How many is news — six of them is the visual form of
  // »alle sechs Würfel zurück« — so the count is the settled position's, and
  // both positions have to agree the table is clear before any are drawn.
  //
  // Live, because dice on the table are standing in these places: the six that
  // come back on a TUTTO must not appear under dice that are still turning.
  //
  // Settled too, because setting dice aside empties the table in the same move
  // that starts their 400ms flight. Gating on the live Roll alone opens that
  // window: the grid is free, the settled position still says six in hand, and
  // an ordinary set-aside of three paints six dashed slots — a TUTTO that did
  // not happen — before correcting to three. While the flight is still running
  // the settled position is the one that had the Roll, so asking it holds the
  // slots back until the dice that earned them have landed.
  const handSlots =
    said === null || over || turn.roll !== null || said.turn.roll !== null
      ? 0
      : said.turn.diceInHand;
  const selectionScore = scoreSelection(
    selected.map((index) => rolled[index]),
    turn.card,
    turn.setAside,
  );

  // The server owns the position, so a rejected move loses nothing — but it
  // must not look like it worked.
  const act = (call: () => Promise<unknown>) => () => {
    setSelected([]);
    setFailed(false);
    void call().catch(() => setFailed(true));
  };
  const toggle = (index: number) =>
    setSelected((current) =>
      current.includes(index)
        ? current.filter((other) => other !== index)
        : [...current, index],
    );
  // Setting the chosen dice aside. What is sent is the order the »Herausgelegt«
  // row takes, and it is the dice left to right across the table rather than the
  // order they were tapped in: both are one act of setting aside, so the row
  // loses nothing by it, and the flights out of the hand stop crossing.
  // `setAside.ts` carries the whole of that argument.
  //
  // The grid is measured in the tap itself, where the dice are still on the
  // table — one frame later the Roll is gone and there is nothing left to ask.
  const commit = () => {
    const cells = [...(grid.current?.children ?? [])].map((cell) =>
      cell.getBoundingClientRect(),
    );
    act(() =>
      setAside({
        gameId: id,
        secret: mine,
        dice: inTableOrder(selected, cells),
      }),
    )();
  };

  return (
    <Jolt struck={struck}>
      {/* The table's top: what the Turn is worth, the deck, and the Card that
          came off it — face-down pile, face-up Card beside it, two piles.
          Three things across the width of a phone, and the split is
          deliberate. Both cards keep their own size, whatever that size is on
          this screen, and »Im Zug« has what is left.
          What it no longer has is a tile. It was a rounded box on the raised
          surface, stretched to the height of the row and to whatever width the
          Cards did not take — the biggest object on the table, holding the
          smallest number on it. A Player who had played the game asked for it
          to be smaller so that the Cards could be bigger, and the honest way to
          do that is to stop drawing a box: what the Turn is worth is a label
          and a number, said on the table itself. The two piles are then the
          only objects in the row, which is what the row is about.
          The Card sits last, to the right of the deck, so the draw is a hop
          between neighbours. Nothing here says so — the flight measures both. */}
      {/* A rule across the head of the page, in the ink, the way a printed page
          opens. It is what tells the two piles they are on a table rather than
          floating at the top of a screen, and it is the only 2px line in the app —
          everything else is a hairline. */}
      <div className="flex items-start gap-3 border-t-2 border-ink pt-(--play-gap)">
        {/* The deck, and the draw. It is the object the Card comes from and it
            is already on the table, so reaching for it is the move — there is
            no button for drawing anywhere else on this screen.
            The same gate as the moves below the table, for the same reason:
            while the dice are in the air the settled position is one event
            behind, and a move made from a position the table has left is one
            the server would refuse. Nothing here moves when it closes — a
            `disabled` button holds its box. */}
        <CardStack
          left={left}
          label={deckLabel(deck, left)}
          disabled={deck === null || settled.settling}
          onDraw={act(() => drawCard({ gameId: id, secret: mine }))}
          ref={pile}
        />
        {/* Where the Cards end up. It is the Game's pile: every Seat's Cards
            land on it and a new Turn does not clear it, so what stands here is
            the whole Game so far and not this Player's hand. How deep it is
            comes off the deck's own count — the number printed on the pile
            beside it — and nothing about it reaches for what is still to
            come. */}
        <PlayedPile
          top={onTop}
          beneath={beneath}
          inForce={cardInForce(turn) !== null}
          left={left}
          pile={pile}
        />
        {/* No tile, and no box of any kind. It has had one twice: a big one
            stretched to the height of the row, which a Player asked to have
            removed because it was the largest object on the table holding the
            smallest number on it, and then a small pale one so the figure could
            have the tile treatment every number in the app used to get. Papier
            has no pale tiles in it and wants no box here at all — what the Turn
            is worth is a label and a number, said on the table itself, and the
            two piles are then the only objects in the row. Which is what the row
            is about.
            Right-aligned under the figure sits what the Card does, so the whole
            right-hand column of this row reads as one thing: what is at stake,
            and under what condition. */}
        <div className="flex flex-1 flex-col items-end">
          {/* The label in the utility face: small, letter-spaced, upper-case, and
              off the same budget as the screen's other quiet type so it tightens
              with everything else on a short screen. A monospace at 10px is the
              one thing in this composition that says instrument rather than
              book. */}
          <div className="legend text-(length:--play-note-text)/(--play-note)">
            Im Zug
          </div>
          {/* Once the Turn is over its points are banked or forfeited, never at
              risk. What a Roll did to them is news, so this is the settled
              Turn's score: it must not drop to zero while the dice that emptied
              it are still turning. On a screen that has just opened it is not
              known yet — the same »wait« the app says while a Game loads, and
              the same three characters, so the row never changes height. */}
          {/* The receipt face, and this is the figure that earns it: what the
              Turn is worth is the one number on this screen the machine is
              printing back, changing as dice are set aside. Dot-matrix for
              measurement, never for prose (`index.css`). */}
          <div className="text-(length:--play-wager)/[0.95] text-ink">
            {said === null ? (
              // Not on the receipt face: `.receipt` is figures only, and Doto's
              // ellipsis at this size is three specks rather than a placeholder.
              <span className="legend align-middle text-[0.6rem]">wartet</span>
            ) : (
              // Counting up as dice are set aside, and down to nothing when the
              // Turn ends — banked into a Seat's score, or forfeited to a
              // Niete. One mechanism for both: the drain is the same count with
              // the numbers the other way round, and it does not know which of
              // the two it is doing. What tells the Player apart is what runs
              // beside it — a Seat's score counting up as this one empties is
              // banking; nothing rising, the row swept and the table jolted is
              // a Niete.
              // The void goes on the figure, not on the column it is right-aligned
              // in: the column is `flex-1` and two thirds of the sheet wide, so a
              // strike drawn on it ruled a diagonal across the whole table.
              <span className={`receipt ${struck ? "struck" : ""}`}>
                <Counting value={over ? 0 : said.turn.score} />
              </span>
            )}
          </div>
        </div>
      </div>

      <CardEffect card={explained} />

      {/*
          The value axis: how close this Seat is to the 6000 that opens the letzte
          Runde, with the stretch still at risk banded rather than banked.

          It answers in one length what the screen could only answer by reading two
          figures and subtracting: the solid run is what is safe, the hatched run
          past it is what this Zug would add and what a Niete would take. A
          Spectator reads it as easily as the Player, which matters on a surface
          where half the people looking cannot act (PRODUCT.md, principle 4).

          Everything it needs is already on the settled position, so it costs no
          query and cannot disagree with the figures above it. Three pixels tall
          with no margin of its own: the fold is at parity and has nothing to give.
      */}
      {said !== null && mySeat !== null && (
        <ValueAxis
          banked={said.seats[mySeat]?.score ?? 0}
          stake={over ? 0 : said.turn.score}
        />
      )}

      {/* Whose Turn it is and what you have, on every phone at the table —
          and every Seat's score one tap behind it. Every score in it is an
          outcome, so it is the settled position's, and it counts to its new
          value from there: a Plus/Minus banks its flat 1000 and docks each of
          the leaders 1000 in one move, and none of those Seats may move while
          the dice that did it are still turning.
          That position and nothing else, `null` included. A reload mid-Roll
          lands on a Player who knows what the table said a second ago, and the
          live position would hand them the Roll's outcome before its dice had
          finished falling. So the row says »…« for that moment, as »Im Zug«
          above it does, and holds its height while it does. */}
      <Scoreboard game={said} gameId={id} secret={secret} mySeat={mySeat} />

      {/* 6000 is crossed by a score rising, and a score can rise on a Roll —
          a Feuerwerk that ends on its Niete banks the Turn there and then. So
          the banner is the settled position's too, or it would announce the
          Final round while the Roll that opened it was still in the air. */}
      {/* One line of gold on the table, and that is a size as much as a
          sentence: it was two lines of bold inside a filled pill, 56px of the
          column and the loudest thing on the screen, for a standing rule that
          is read once. What 6000 did is on the leaderboard directly above it;
          what is left to say is what happens now. The fill went with the
          second line — an accent at 15% over charcoal is a muddy brown, and
          this notice sits directly under a box already. */}
      {said?.phase === "finalRound" && (
        // A banded field, which is how this sheet says "a rule is in force" — it
        // was terracotta, and there is no terracotta here. It costs the fold
        // nothing: the band takes only horizontal padding, so its height is the
        // line's own `--play-note` exactly as it was when it was coloured type.
        // The pill this replaces was removed once for being two lines tall inside
        // a box; this is one line and no box.
        <p className="reversed rounded-tile px-2 text-center text-(length:--play-note-text)/(--play-note) font-semibold">
          letzte Runde — die höchste Punktzahl gewinnt
        </p>
      )}

      {/* The table sits in the stack and nowhere else, at whatever height the
          things above it put it. It briefly took the spare height and centred
          itself in it, to stop a tall screen looking like a strip of content with
          a button stranded at the bottom — and that broke the one promise this
          screen makes. With the slack above *and* below the dice, every height
          change anywhere in the column moved them by half of it, so pressing a
          button shifted the table. The slack is centred once, around the whole
          composition, in `Jolt`; inside it nothing may move relative to anything
          else. */}
      <DiceGrid
        game={game}
        gameId={id}
        secret={secret}
        choosing={myTurn && picking}
        selected={selected}
        onToggle={toggle}
        handSlots={handSlots}
        grid={grid}
        still={still}
        holdSince={hold.since}
        wound={hold.wound}
      />

      {/* Held open from the start of the Turn: the first die set aside must not
          push everything below it down while the Player is aiming. */}
      <SetAsideRow faces={inTheRow} sweep={forfeit} roll={rolled} grid={grid} />

      {/* The moves belong to the Seat whose Turn it is. Everyone else has the
          same screen without them, and watches the Turn play out on it.
          Two slots, and they keep their height in every phase and for every
          Seat: the move this phase offers, then »aufhören«. What changes
          between taps is what sits in a slot, never where the slot is — so a
          thumb already on its way down lands on what it was aiming at.
          Drawing is the one phase whose move is not in them: the deck at the
          top of the screen is that button. The slot holds the line saying so,
          and holds the same height doing it. */}
      {/* Under the table now, and above the moves, which is where the eye already
          is: it answers the Roll it is reporting on, and the hand that just threw
          it is on its way to the button below. Above the table it held two empty
          lines between the Seats and the dice for the whole of every Turn that had
          nothing to say — a hole in the middle of the page, which on this ground is
          the one thing that shows.
          One line, always the same height, whether or not it has anything to
          say — the news must not shove the table while the Player is aiming.
          Exactly one message, chosen in `turnMessage`, because more than one of
          them can be true at once. A refused move takes the line while it is
          up: it answers the tap just made, and the Turn's own news is still
          there after the next one.
          The Turn's line is the settled Turn's, so »Niete!« arrives with the
          last die and not before it. The refusal is not: it has no animation
          behind it and nothing to wait for. */}
      {/*
          The news, and on this ground it is a stamp rather than a colour.

          The line used to be a red sentence for a refusal and bold ink for
          everything else, and this sheet has no red in it — a state is a mark or
          an inversion (`index.css`). So the two kinds of news take the two marks
          the slip already owns:

            a Niete or a Stop-Karte  reversed out, the way a clerk stamps a slip
                                     that is finished with
            a refused move           struck, the overprint that voids an entry

          A TUTTO stays plain bold ink on the sheet, which is the right asymmetry:
          it is the Turn continuing, not a thing being closed.

          `h-(--play-news)` and not `min-h-`. The box is a *fixed* height the fold
          budget reserved at exactly two lines, and a stamped field carries padding
          a bare sentence did not — with `min-h-` a one-line stamp on the shortest
          screen could grow the column and break the one promise this screen makes.
          Fixed height plus centring cannot grow, so the news is a stamp landing
          inside a box that was always that size.
      */}
      <div className="flex h-(--play-news) items-center justify-center">
        {failed ? (
          <p
            role="alert"
            className="struck w-full rounded-tile px-2 text-center text-(length:--play-note-text)/(--play-note)"
          >
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        ) : (
          message !== null && (
            <p
              className={`w-full rounded-tile px-2 text-center text-(length:--play-news-text)/(--play-news-line) font-bold ${
                over ? "reversed py-1" : ""
              }`}
            >
              {message}
            </p>
          )
        )}
      </div>

      {/* A Roll throws only the dice in hand, so only these ever tumble. Each
          Roll mounts a fresh set of dice, which is what starts the animation.
          The key is the Roll itself rather than the position, so a watching
          phone replays the tumble even if it never rendered the empty hand in
          between — the same subscription, the same animation, no second
          mechanism. */}

      {/* No `mt-auto` any more: the table above takes the spare height, so the
          moves sit directly under it. Two things both claiming the slack is how a
          screen ends up with a hole in the middle of it. */}
      <div className="flex flex-col gap-(--play-gap)">
        {/* What a slot holds is the settled position's move, so it changes when
            the dice land and not when they are thrown.
            That position is one event behind while the dice are in the air, and
            a move made from a position the table has left is one the server
            would refuse. So the moves are switched off for exactly as long, and
            by the element that exists to do it: a disabled `fieldset` is what
            turns off every control inside it, and `display: contents` keeps it
            out of the layout, so nothing here moves by a pixel. */}
        <fieldset disabled={settled.settling} className="contents">
          {/* Someone who arrived after the start has no Seat and no move: their
              slot stays empty, holding its height like every other phase. That
              they are watching is said once, in the scoreboard row, which is
              the seam that knows this device has no Seat. */}
          <div className="min-h-(--play-slot)">
            {myTurn && choosing && (
              <button
                className={primary}
                disabled={selectionScore === null}
                onClick={commit}
              >
                herauslegen{selectionScore ? ` (+${selectionScore})` : ""}
              </button>
            )}
            {myTurn && said?.turn.phase === "awaitingRoll" && (
              // Press and hold to wind the dice up; let go to throw them. A
              // tap throws too, and so does `Enter`, and so does an assistive
              // click — the hold sits on top of a button that is still a
              // button, because press-and-hold is a gesture plenty of people
              // cannot make and this app does not trade that for an effect.
              // `useSpin.ts` carries the rest of that argument.
              //
              // `touch-none` and `select-none` are not styling: a long hold is
              // exactly what a phone reads as a drag to scroll or a press to
              // select, and either one takes the release away from the button.
              <button
                className={`${primary} touch-none select-none`}
                {...hold.handlers}
              >
                Würfeln
              </button>
            )}
            {/* Drawing has no button in this slot, because the deck above is
                the button: the Card comes off it, it is already on the table,
                and a full-width bar down here saying »Karte ziehen« was a
                second place to make the same move that pointed away from the
                thing making it.
                What stands here instead is the move said out loud. The slot
                holds its height whatever is in it, so this costs nothing — and
                it earns its place twice. It names the deck for a Player who has
                not yet learned it is tappable; and after a TUTTO it is where
                the stake is stated, directly above »aufhören«, so the two
                halves of that decision are one sentence and one button read
                together rather than a control at each end of the screen.
                Loud only for the half that risks something, and loud in colour
                rather than in more words: the slot is 44px on the shortest
                phone this screen is built for, which is two lines of the quiet
                type, and the sentence is written to fit in them.
                This also covers the Seat up next on a Turn that is over. There
                was a »Neuer Zug« here once, pressed by the Player who had just
                finished, and the next Turn could not begin until they pressed
                it — a table waiting on somebody who had stopped playing. Every
                Turn starts with a Card, so closing the finished Turn and
                drawing were always the same two taps in the same order: the
                server does both in one mutation, and the deck is the one tap.
                The solo Game is the same position, where the Seat up next is
                the Player themselves. */}
            {deck !== null && (
              <p
                className={`flex min-h-(--play-slot) items-center justify-center text-center text-(length:--play-note-text)/(--play-note) font-semibold ${
                  // Loud against quiet, said in the two inks this sheet has
                  // rather than in a red it does not. `text-alarm` resolved here
                  // before and resolves to the same pixels — the token is the ink
                  // now — but naming a colour the palette has retired is how a
                  // call site outlives the decision behind it.
                  deck.risky ? "font-bold text-ink" : "text-muted"
                }`}
              >
                {deck.prompt}
              </p>
            )}
          </div>
          <div className="min-h-(--play-slot)">
            {myTurn && deciding && (
              <button
                className={`${button} bg-raised`}
                // A forcing Card takes stopping away: the move is offered dead
                // rather than offered live and refused by the server.
                disabled={!stoppable}
                onClick={act(() => stop({ gameId: id, secret: mine }))}
              >
                aufhören
              </button>
            )}
          </div>
        </fieldset>
        {/* Abandoning ends the Game for everyone, so it is any seated Player's
            move and no Spectator's — and there is nothing gentler on offer:
            no Turn may be skipped and no Seat removed (ADR 0005). */}
        {mySeat !== null && (
          <button
            className="min-h-(--play-quiet) text-sm text-muted"
            onClick={
              abandoning
                ? act(() => abandon({ gameId: id, secret: mine }).then(onBack))
                : () => setAbandoning(true)
            }
          >
            {abandoning ? "Wirklich abbrechen?" : "Spiel abbrechen"}
          </button>
        )}
      </div>
    </Jolt>
  );
}
