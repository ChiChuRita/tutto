import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { m, useReducedMotion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  canStop,
  cardsLeft,
  scoreSelection,
  seatMayPlay,
  winners,
  type Face,
  type GameState,
} from "./game/turn";
import { Die } from "./Die";
import { Lobby } from "./Lobby";
import { turnMessage } from "./message";
import { scoreboardRow } from "./scoreboard";
import { CardEffect, CardStack, PlayedPile } from "./Card";
import { cardInForce } from "./cards";
import type { FlightStart } from "./flight";
import { FLIGHT, FLIGHT_EASE } from "./motion";
import type { Presence } from "./presence";
import { takeoffs, type HandDie } from "./setAside";
import { dieSeed } from "./settled";
import { useCount } from "./useCount";
import { usePresence } from "./usePresence";
import { useSettled } from "./useSettled";

/**
 * A move. `--play-slot` is the height the screen can afford it — 3.5rem where
 * there is room and never below 2.75rem, because a move you cannot hit is a
 * move you do not have. The slot it sits in holds the same height whether or
 * not this phase offers the move, so nothing shifts between taps.
 */
const button =
  "min-h-(--play-slot) w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";
const primary = `${button} bg-blue-600 text-white`;

/**
 * Every die in a Roll looks the same. Which of them score is the Player's to
 * work out — it is most of the skill in Tutto — so the only thing a die says is
 * whether the Player has picked it up.
 */
const inHand = "bg-die text-neutral-900";
const chosen = "bg-blue-600 text-white";

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
              present ? "bg-emerald-400" : "border border-current opacity-40"
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
 * A score, counting to its new value rather than jumping to it — so what you
 * read is the size of what just happened and not only the result. Every score
 * on this screen wears it: a Seat's when a Turn is banked, all of them at once
 * when a Plus/Minus pays the Player and docks the leaders, and »Im Zug« as dice
 * are set aside and when the Turn empties it again.
 *
 * The count lives in here rather than in the row around it, so a number running
 * re-renders itself thirty times and leaves the table it sits in alone.
 *
 * Tabular figures, because the digits change under each other: a proportional
 * »1« is narrower than a »4«, and a number counting through a few hundred of
 * them would breathe in and out. Everything a count passes through lies between
 * the two ends, so it can never be wider than the number it lands on either —
 * the screen holds still while it runs and after it has finished.
 */
function Counting({ value }: { value: number }) {
  return <span className="tabular-nums">{useCount(value)}</span>;
}

/**
 * The whole table, one row high: whose Turn it is and what you have — the two
 * things a Player checks between taps — with every Seat's score behind the tap.
 * Everyone sees the same list, because Tutto hides nothing but the undrawn
 * deck, so a Spectator's scoreboard is a Player's scoreboard.
 *
 * That is not tidiness. A row per Seat costs about 104px on a phone, and the
 * screen does not have 104px: at four Seats it was that much over a 390×844
 * viewport all by itself. Folding the Seats and the »am Zug« line into one row
 * is what bought the Card and the sixth die their place.
 *
 * The row is one fixed-height control that never changes height, and a modal
 * dialog sits outside the flow, so opening and closing it moves nothing behind
 * it — the play screen holds still under the Player's thumb.
 *
 * It is also where presence lives, for the same reason the scores do: this
 * device's check-ins and everyone else's are read here and nowhere else, so a
 * heartbeat three times a minute re-renders this row and leaves the dice and
 * the Card alone.
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
  const { turn, standing, score } = scoreboardRow(game, mySeat);
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
        className="flex h-(--play-row) w-full items-center justify-between gap-3 rounded-xl bg-neutral-500/15 px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="truncate">{turn}</span>
          {/* Presence for the Seat whose Turn it is, because that is the
              question a waiting Player has: is anyone going to move? Never for
              your own Turn — you are the one being waited for, and »Du bist am
              Zug. — gerade da« tells you something you could not fail to know.
              Every Seat's, yours included, is behind the tap. The dot keeps its
              8px in every state including that one, so the row's height never
              depends on what it has to say. */}
          <PresenceDot
            present={
              active === null || active === mySeat ? null : presenceOf(active)
            }
          />
        </span>
        <span className="flex shrink-0 items-center gap-1 opacity-80">
          {standing}
          {/* Your own score counts here too, not only in the list behind the
              tap — the list is shut most of the time, and a Plus/Minus taking
              1000 off you while it is shut is exactly the moment worth
              seeing. A Spectator has no score, and then the words are the
              whole row. */}
          {score !== null && <Counting value={score} />}
          {/* The label of the control, said only where the text cannot: the
              visible half-row is the news, not the promise of what a tap
              brings. */}
          <span className="sr-only">— alle Punkte anzeigen</span>
          <span aria-hidden>›</span>
        </span>
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
        className="m-auto w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-neutral-800 p-0 text-light backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <h2 id="scores-heading" className="flex-1 text-lg font-bold">
              Punkte
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-lg bg-neutral-500/25 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
                className={`flex items-center justify-between gap-3 rounded-xl p-3 ${
                  index === active
                    ? "bg-blue-600/25 font-bold"
                    : "bg-neutral-500/15"
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
                    <span className="text-xs font-normal opacity-70">
                      am Zug
                    </span>
                  )}
                  {/* Several of these move at once under a Plus/Minus, which
                      is the whole character of that Card: it pays the Player
                      1000 and docks every Seat in the lead. Watching them all
                      fall together is the thing to see. */}
                  <Counting value={seat.score} />
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
   */
  faces: Face[];
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

  return (
    <div>
      <div className="text-(length:--play-note-text)/(--play-note) opacity-70">
        Herausgelegt
      </div>
      {/* Set aside and out of play: smaller, darker, and never rerolled.
          These never tumble, so they need no room to sweep through and their
          box is just the die. */}
      <div className="flex min-h-(--play-set-aside) flex-wrap gap-2 [--die-box:var(--play-set-aside)] [--die-size:var(--play-set-aside)]">
        {faces.map((face, index) => (
          // The place in the row is held whether or not the die in it is ready
          // to be drawn, so a die arriving neither moves the row nor resizes
          // it. It is also what the flight is measured to.
          <div
            key={index}
            ref={(element) => {
              berths.current[index] = element;
            }}
            className="die-berth"
          >
            {index < flights.length && (
              <m.div
                // The offset it starts at and nothing else — no scale, and
                // this is the end of the seam where that costs something. The
                // die leaves a box nearly three times the width of the berth
                // it lands in, so scaling it would be the realistic choice: it
                // would take off at the size it really was. It would also
                // sweep over the dice either side of it, and `.die`'s
                // perspective makes a die painted over by its neighbour look
                // clipped rather than overlapped — the paint-order bug a
                // previous fix traced and settled. So the die travels at the
                // size it lands at: the reserved room is the room, in flight
                // as at rest.
                initial={flights[index]}
                animate={{ x: 0, y: 0 }}
                transition={{ duration: FLIGHT, ease: FLIGHT_EASE }}
              >
                <Die
                  face={face}
                  seed={index}
                  tumble={false}
                  faceClass="bg-neutral-700 text-neutral-200"
                />
              </m.div>
            )}
          </div>
        ))}
      </div>
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-center text-2xl font-bold">Spiel vorbei</h2>
      {/* An abandoned Game keeps its scores but has no winner to name. */}
      <p className="rounded-xl bg-amber-500/15 p-4 text-center text-xl font-bold">
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
            className="flex justify-between rounded-xl bg-neutral-500/15 p-3 text-lg"
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
  const nextTurn = useMutation(api.games.nextTurn);
  const abandon = useMutation(api.games.abandon);
  const [selected, setSelected] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  // Walking away cannot be undone, so it takes a second tap.
  const [abandoning, setAbandoning] = useState(false);
  // The pile, so a drawn Card can measure where it is flying from. It sits
  // beside the slot in the stat row now, so the flight is a short sideways hop
  // — measured, like every other layout, rather than written down here.
  const pile = useRef<HTMLDivElement>(null);
  // The dice grid, so a die set aside can measure the place it is leaving.
  const grid = useRef<HTMLDivElement>(null);

  if (game === undefined) return <p className="text-center">Lädt …</p>;
  // A link to a Game that never existed, or one typed wrong: say so plainly.
  if (game === null) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-center text-xl">Dieses Spiel gibt es nicht.</p>
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
  const shown = cardInForce(turn);
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
  // The hand, dashed. None while a Roll is on the table, because the dice are
  // standing in these places — so the six that come back on a TUTTO cannot
  // appear under dice that are still turning.
  const handSlots =
    said === null || over || turn.roll !== null ? 0 : said.turn.diceInHand;
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

  return (
    // Eight gaps down this column, all of them off `--room` in `index.css`:
    // air is the first thing the screen gives when it is short, and eight of
    // anything adds up. Everything below sits in a slot of a fixed height, so
    // what changes between taps is what is in a slot and never where it is.
    <div className="flex flex-1 flex-col gap-(--play-gap)">
      {/* The table's top: what the Turn is worth, the deck, and the Card that
          came off it — face-down pile, face-up Card beside it, two piles.
          Three things across the width of a phone, and the split is
          deliberate. Both cards keep their own size, whatever that size is on
          this screen, and »Im Zug« takes what is left — still the widest thing
          in the row. The row is one card tall, so the Card costs nothing here
          and gives up the row it used to have to itself.
          The Card sits last, to the right of the deck, so the draw is a hop
          between neighbours. Nothing here says so — the flight measures both. */}
      <div className="flex gap-3 text-center">
        <div className="flex flex-1 flex-col justify-center rounded-xl bg-neutral-500/15 p-(--play-pad)">
          {/* The tile keeps its padding and its label off the same budget as
              everything else, so on a short screen the row's height is the
              Card's and not this tile's. */}
          <div className="text-(length:--play-note-text)/(--play-note) opacity-70">
            Im Zug
          </div>
          {/* Once the Turn is over its points are banked or forfeited, never at
              risk. What a Roll did to them is news, so this is the settled
              Turn's score: it must not drop to zero while the dice that emptied
              it are still turning. On a screen that has just opened it is not
              known yet — the same »wait« the app says while a Game loads, and
              the same three characters, so the row never changes height. */}
          <div className="text-3xl font-bold">
            {said === null ? (
              "…"
            ) : (
              // Counting up as dice are set aside, and down to nothing when the
              // Turn ends — banked into a Seat's score, or forfeited to a
              // Niete. One mechanism for both, which is what ticket 10's drain
              // is: the same count with the numbers the other way round.
              <Counting value={over ? 0 : said.turn.score} />
            )}
          </div>
        </div>
        <CardStack left={left} ref={pile} />
        {/* Where the Cards end up. It is the Game's pile: every Seat's Cards
            land on it and a new Turn does not clear it, so what stands here is
            the whole Game so far and not this Player's hand. How deep it is
            comes off the deck's own count — the number printed on the pile
            beside it — and nothing about it reaches for what is still to
            come. */}
        <PlayedPile card={shown} left={left} pile={pile} />
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
      {said?.phase === "finalRound" && (
        <p className="rounded-xl bg-amber-500/25 p-(--play-pad) text-center text-(length:--play-note-text)/(--play-note) font-bold">
          letzte Runde — 6000 sind geknackt. Am Ende gewinnt die höchste
          Punktzahl.
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
          <p className="rounded-xl bg-red-500/20 p-(--play-pad) text-center text-(length:--play-note-text)/(--play-note)">
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
      {/* No gap: each die's box already reserves the room its cube sweeps
          through, and that reserved room is the space between them.
          Always two rows, whatever is in them. Six dice fill two rows and three
          fill one, so a grid that sized itself to its contents would lift the
          set-aside row and both button slots by a whole `--die-box` the moment
          the Player set a die aside. Two rows is what the tallest case needs
          anyway, so reserving them costs nothing. */}
      <div
        ref={grid}
        className="grid grid-cols-3 grid-rows-[repeat(2,var(--die-box))] justify-items-center"
      >
        {rolled.map((face, index) => {
          // Any die may be picked up. A selection that scores nothing is
          // refused at »herauslegen«, by the same function the server
          // validates with — so nothing here has to know which dice score.
          // The live phase, not the settled one: picking a die up is the
          // Player's own decision and gives nothing away, so a Player who has
          // already made up their mind may do it while the dice still turn.
          // Committing is what waits, because that is where the news is.
          const selectable = myTurn && picking;
          const isChosen = selected.includes(index);
          return (
            <button
              key={`${rolled.join("")}-${index}`}
              type="button"
              disabled={!selectable}
              aria-pressed={selectable ? isChosen : undefined}
              onClick={() => toggle(index)}
              className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <Die
                face={face}
                seed={dieSeed(index, face)}
                tumble
                faceClass={isChosen ? chosen : inHand}
              />
            </button>
          );
        })}
        {Array.from({ length: handSlots }, (_, index) => (
          <div
            key={`hand-${index}`}
            className="die-blank placeholder rounded-xl"
          />
        ))}
      </div>

      {/* Held open from the start of the Turn: the first die set aside must not
          push everything below it down while the Player is aiming. */}
      <SetAsideRow faces={turn.setAside} roll={rolled} grid={grid} />

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
                onClick={act(() =>
                  setAside({ gameId: id, secret: mine, dice: selected }),
                )}
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
              <button
                className={primary}
                onClick={act(() => roll({ gameId: id, secret: mine }))}
              >
                Würfeln
              </button>
            )}
            {myTurn && over && (
              <button
                className={primary}
                onClick={act(() => nextTurn({ gameId: id, secret: mine }))}
              >
                Neuer Zug
              </button>
            )}
          </div>
          <div className="min-h-(--play-slot)">
            {myTurn && deciding && (
              <button
                className={`${button} bg-neutral-500/25`}
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
            className="min-h-(--play-quiet) text-sm opacity-70"
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
    </div>
  );
}
