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
  scoreSelection,
  seatMayPlay,
  seatMayTakeOver,
  winners,
  type Face,
  type GameState,
} from "./game/turn";
import { Die } from "./Die";
import { Lobby } from "./Lobby";
import { forfeitedToANull, turnMessage } from "./message";
import { affordsLeaderboard, leaderboard, scoreboardRow } from "./scoreboard";
import { CardEffect, CardStack, PlayedPile } from "./Card";
import { cardBeneath, cardInForce, cardOnTop } from "./cards";
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
import { tiltDegrees } from "./dice";
import { chosenDice, rollKey } from "./selection";
import { inTableOrder, takeoffs, type HandDie } from "./setAside";
import { spinningSince } from "./spin";
import { dieSeed } from "./settled";
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
const button =
  "min-h-(--play-slot) w-full rounded-control px-4 text-lg font-semibold disabled:bg-off disabled:text-off-ink disabled:shadow-none";
const primary = `${button} bg-azure text-on-accent pressable`;

/**
 * Every die in a Roll looks the same. Which of them score is the Player's to
 * work out — it is most of the skill in Tutto — so the only thing a die says is
 * whether the Player has picked it up.
 *
 * Picked up is said in the ground the pips sit on and not in the pips, so the
 * two states are one hue apart and the drawing is identical: a pale die, and
 * the same die in the colour the moves are made in.
 */
const inHand = "bg-die text-ink";
const chosen = "bg-azure text-on-accent";

/** What every control on this screen is focused with. */
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure";

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
    <span className="inline-flex h-2 w-2 shrink-0 items-center justify-center">
      {present !== null && (
        <>
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${
              present ? "bg-jade" : "border border-muted"
            }`}
          />
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
        className={`flex w-full flex-col justify-center rounded-tile bg-raised px-4 shadow-soft ${focus} ${
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
            <span className="sr-only">— alle Punkte anzeigen</span>
            <span aria-hidden>›</span>
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
                className={`flex h-(--play-rank) items-center justify-between gap-3 ${
                  row.you ? "font-semibold" : "opacity-70"
                }`}
              >
                <span className="truncate">{row.you ? "Du" : row.name}</span>
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
        className={`m-auto w-[min(20rem,calc(100vw-2rem))] rounded-panel bg-lifted p-0 text-ink shadow-lift backdrop:bg-ink/25 ${still ? "" : "pop-in"}`}
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <h2 id="scores-heading" className="flex-1 text-lg font-bold">
              Punkte
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={`rounded-control bg-raised px-3 py-2 text-sm ${focus}`}
            >
              Schließen
            </button>
          </div>
          {/* A reading surface and nothing else: there is nothing to do to a
              Seat from here. Which Seat is rolling is said in words as well as
              in colour, so it survives being read out. */}
          <ul className="flex flex-col gap-2">
            {(game?.seats ?? []).map((seat, index) => (
              <li
                key={index}
                className={`flex items-center justify-between gap-3 rounded-tile p-3 ${
                  index === active ? "bg-azure/25 font-bold" : "bg-raised"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">
                    {seat.name}
                    {/* Which of these is you, on a table of names you chose
                        yourself. */}
                    {index === mySeat && (
                      <span className="font-normal"> (du)</span>
                    )}
                  </span>
                  {/* The full picture: every Seat, present or away. */}
                  <PresenceDot present={presenceOf(index)} />
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {index === active && (
                    <span className="text-xs font-normal text-muted">
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
                  <Counted shown={counted[index]} value={seat.score} />
                </span>
              </li>
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
            className="die-blank placeholder rounded-control"
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
            seed={index}
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
      <div className="text-(length:--play-note-text)/(--play-note) text-muted">
        Herausgelegt
      </div>
      {/* Set aside and out of play: smaller, darker, and never rerolled.
          These never tumble, so they need no room to sweep through and their
          box is just the die. */}
      <div className="flex min-h-(--play-set-aside) flex-wrap gap-(--play-set-aside-gap) [--die-box:var(--play-set-aside)] [--die-size:var(--play-set-aside)]">
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
                    seed={index}
                    plays="nothing"
                    faceClass="bg-muted text-ink"
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
      className="grid grid-cols-3 grid-rows-[repeat(2,var(--die-box))] justify-items-center rounded-panel bg-felt"
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
            className={`rounded-control ${focus}`}
          >
            <Die
              face={face}
              seed={dieSeed(index, face)}
              // Thrown, not laid out. A rotation and never an offset: the die's
              // centre is where it always was, so the room its cube sweeps
              // through is still reserved and the bug that looked like clipping
              // stays fixed. `dice.ts` carries the argument.
              tilt={tiltDegrees(roll, index)}
              plays="tumble"
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
    <m.div className="flex flex-1 flex-col gap-(--play-gap)" animate={jolt}>
      {children}
    </m.div>
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-center text-2xl font-bold">Spiel vorbei</h2>
      {/* An abandoned Game keeps its scores but has no winner to name. */}
      <p className="rounded-tile bg-raised p-4 text-center text-xl font-bold text-gold">
        {abandoned
          ? "Abgebrochen"
          : won.length === 1
            ? `${names} gewinnt!`
            : `Unentschieden: ${names}`}
      </p>
      {/* A Kleeblatt wins from any score, so the scores below will not explain it. */}
      {!abandoned && game.turn.phase === "won" && (
        <p className="text-center text-lg">
          Kleeblatt! Zwei TUTTOs hintereinander.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {seats.map((seat, index) => (
          <li
            key={index}
            className="flex justify-between rounded-tile bg-raised p-3 text-lg shadow-soft"
          >
            <span>{seat.name}</span>
            <span className="font-bold">{seat.score} Punkte</span>
          </li>
        ))}
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
  const pile = useRef<HTMLDivElement>(null);
  // The dice grid, so a die set aside can measure the place it is leaving —
  // and, while »Würfeln« is held, the one element the wind-up's angle is
  // written onto for the whole hand to read.
  const grid = useRef<HTMLDivElement>(null);
  const windUp = useMutation(api.presence.winding);
  // The one hook the whole app decides movement with. Here it decides whether
  // there is a wind-up at all: a Player who asked for no movement presses the
  // button and simply gets their Roll.
  const still = useReducedMotion() === true;
  // Dice already on the table: whatever was being wound up has arrived, and
  // there is nothing left to turn on nothing.
  const thrown = game !== null && game !== undefined && game.turn.roll !== null;

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
    thrown,
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
  // Up next, on a Turn that has already finished: this Seat may start playing
  // without waiting for whoever just finished to clear the table.
  //
  // Read off the settled position and not the live one, which is what keeps it
  // from being a spoiler. The Turn ahead ends on a Niete the moment the dice
  // are thrown, and the live position knows it while this Player's screen is
  // still showing six dice in the air; a button appearing there would announce
  // the outcome before the table did. On `said` it arrives with the news.
  const myTakeOver =
    mySeat !== null && said !== null && seatMayTakeOver(said, mySeat);
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
      <div className="flex items-center gap-3">
        {/* A tile again, and a smaller one than the tile `real-table 04`
            removed. That one was stretched to the height of the row and to
            every pixel the Cards did not take — the biggest object on the
            table holding the smallest number on it, which is why a Player
            asked for it to go. This hugs its own content instead: the Cards
            keep every pixel they gained, and the number gets the pale-tile
            treatment every number in the app now has. */}
        <div className="flex-1">
          <div className="inline-block rounded-tile bg-violet px-4 py-2 text-center">
            {/* The label is off the same budget as the screen's other quiet type,
              so it tightens with everything else on a short screen. */}
            <div className="text-(length:--play-note-text)/(--play-note) text-muted">
              Im Zug
            </div>
            {/* Once the Turn is over its points are banked or forfeited, never at
              risk. What a Roll did to them is news, so this is the settled
              Turn's score: it must not drop to zero while the dice that emptied
              it are still turning. On a screen that has just opened it is not
              known yet — the same »wait« the app says while a Game loads, and
              the same three characters, so the row never changes height. */}
            <div className="font-display text-(length:--play-score)/tight font-bold text-violet-ink">
              {said === null ? (
                "…"
              ) : (
                // Counting up as dice are set aside, and down to nothing when the
                // Turn ends — banked into a Seat's score, or forfeited to a
                // Niete. One mechanism for both: the drain is the same count with
                // the numbers the other way round, and it does not know which of
                // the two it is doing. What tells the Player apart is what runs
                // beside it — a Seat's score counting up as this one empties is
                // banking; nothing rising, the row swept and the table jolted is
                // a Niete.
                <Counting value={over ? 0 : said.turn.score} />
              )}
            </div>
          </div>
        </div>
        <CardStack left={left} ref={pile} />
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
      </div>

      <CardEffect card={explained} />

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
        <p className="text-center text-(length:--play-note-text)/(--play-note) font-semibold text-gold">
          letzte Runde — die höchste Punktzahl gewinnt
        </p>
      )}

      {/* One line, always the same height, whether or not it has anything to
          say — the news must not shove the table while the Player is aiming.
          Exactly one message, chosen in `turnMessage`, because more than one of
          them can be true at once. A refused move takes the line while it is
          up: it answers the tap just made, and the Turn's own news is still
          there after the next one.
          The Turn's line is the settled Turn's, so »Niete!« arrives with the
          last die and not before it. The refusal is not: it has no animation
          behind it and nothing to wait for. */}
      <div className="min-h-(--play-news)">
        {failed ? (
          <p className="rounded-tile bg-raised p-(--play-pad) text-center text-(length:--play-note-text)/(--play-note) text-alarm">
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        ) : (
          message !== null && (
            <p className="text-center text-(length:--play-news-text)/(--play-news-line) font-bold">
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
      />

      {/* Held open from the start of the Turn: the first die set aside must not
          push everything below it down while the Player is aiming. */}
      <SetAsideRow faces={inTheRow} sweep={forfeit} roll={rolled} grid={grid} />

      {/* The moves belong to the Seat whose Turn it is. Everyone else has the
          same screen without them, and watches the Turn play out on it.
          Two slots, and they keep their height in every phase and for every
          Seat: the move this phase offers, then »aufhören«. What changes
          between taps is what sits in a slot, never where the slot is — so a
          thumb already on its way down lands on what it was aiming at. */}
      <div className="mt-auto flex flex-col gap-(--play-gap)">
        {/* What a slot holds is the outcome said out loud — after a Niete the
            only move left is »Neuer Zug«, after a TUTTO it is »weitermachen« —
            so the slots hold the settled position's moves and change when the
            dice land.
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
            {myTurn && said?.turn.phase === "awaitingCard" && (
              <button
                className={primary}
                onClick={act(() => drawCard({ gameId: id, secret: mine }))}
              >
                {/* Rolling on after a Tutto means taking a new Card first. */}
                {said.turn.tutto ? "weitermachen" : "Karte ziehen"}
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
            {/* The Seat up next, on a Turn that is over: drawing is the whole
                move, and it is the only move. There was a »Neuer Zug« here,
                pressed by the Player who had just finished, and the next Turn
                could not begin until they pressed it — a table waiting on
                somebody who had stopped playing, and who may well have put the
                phone down.
                It is gone rather than kept beside this, because every Turn
                starts with a Card: closing the finished Turn and drawing were
                always going to be the same two taps in the same order, so the
                first of them was a step and never a decision. The server does
                both in one mutation, which is one transaction, so there is no
                moment where the table has been handed over and nobody is
                holding it.
                This covers the solo Game too, where the Seat up next is the
                Player themselves — which is why it is not gated on the Turn
                being somebody else's. */}
            {myTakeOver && (
              <button
                className={primary}
                onClick={act(() => drawCard({ gameId: id, secret: mine }))}
              >
                Karte ziehen
              </button>
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
