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
import type { FlightStart } from "./draw";
import { takeoffs, type HandDie } from "./setAside";
import { usePresence } from "./usePresence";

const button =
  "min-h-14 w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";
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
 * ring if not, and nothing at all until the first answer arrives — not yet
 * known is not the same as away. Away is a quiet state: nobody is being kicked
 * and no Turn is being skipped (ADR 0005), so it is a dot and not a warning.
 *
 * The same 8px in every state, because the row it sits in is a hard `h-12` and
 * the play screen must hold still under the Player's thumb. Filled against
 * hollow rather than one colour against another, so it survives a screen in
 * the sun and eyes that do not separate the two — and it is said in words for
 * a reader that sees neither.
 */
function PresenceDot({ present }: { present: boolean | null }) {
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
 * The whole table, one row high: whose Turn it is and what you have — the two
 * things a Player checks between taps — with every Seat's score behind the tap.
 * Everyone sees the same list, because Tutto hides nothing but the undrawn
 * deck, so a Spectator's scoreboard is a Player's scoreboard.
 *
 * That is not tidiness. Measured at 390×844 with four Seats, the banner up and
 * a Card whose effect wraps: the dice used to end 6.5px above the fold, which
 * no real browser's chrome leaves — it takes 50–90px more. Folding the Seats
 * and the »am Zug« line into this one row gives 64px back; the app's title
 * leaving the screen in a Game and the column above tightening to `gap-4` give
 * another 24. The dice now end 94.5px clear, which survives that chrome.
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
  game: GameState;
  /** The Game itself, not the string in the address bar: this one exists. */
  gameId: Id<"games">;
  /** This device's proof of its Seat (ADR 0004), or `null` if it holds none. */
  secret: string | null;
  /** This device's Seat, or `null` for a Spectator. */
  mySeat: number | null;
}) {
  const rowButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const { turn, standing } = scoreboardRow(game, mySeat);
  const present = usePresence(gameId, secret);
  // `null` while the first answer is still coming: not yet known is not the
  // same as away, and neither of them is worth a jump on the screen.
  const presenceOf = (index: number) =>
    present === null ? null : present.has(index);

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
        onClick={() => dialog.current?.showModal()}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-neutral-500/15 px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="truncate">{turn}</span>
          {/* Presence for the Seat whose Turn it is, because that is the
              question a waiting Player has: is anyone going to move? Every
              other Seat's is behind the tap. The dot is the same 8px in both
              states, so the row stays `h-12` either way. */}
          <PresenceDot present={presenceOf(game.activeSeatIndex)} />
        </span>
        <span className="flex shrink-0 items-center gap-1 opacity-80">
          {standing}
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
            {game.seats.map((seat, index) => (
              <li
                key={index}
                className={`flex items-center justify-between gap-3 rounded-xl p-3 ${
                  index === game.activeSeatIndex
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
                  {index === game.activeSeatIndex && (
                    <span className="text-xs font-normal opacity-70">
                      am Zug
                    </span>
                  )}
                  {seat.score}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

/** Seconds a die takes to travel from the hand down into the row. */
const FLIGHT = 0.35;

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
  /** The row, oldest first. It only ever grows within a Turn. */
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
    // one taken before it. The grid holds placeholders instead of dice between
    // Rolls, so the count is what says which of the two this is.
    const dice = grid.current?.children;
    if (roll.length > 0 && dice?.length === roll.length) {
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
      <div className="text-sm opacity-70">Herausgelegt</div>
      {/* Set aside and out of play: smaller, darker, and never rerolled.
          These never tumble, so they need no room to sweep through and their
          box is just the die. */}
      <div className="flex min-h-9 flex-wrap gap-2 [--die-box:2.25rem] [--die-size:2.25rem]">
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
                // Only ever the offset it starts at, so the die travels at the
                // size it lands at and never grows over its neighbours — the
                // reserved room is the room, in flight as at rest.
                initial={flights[index]}
                animate={{ x: 0, y: 0 }}
                transition={{ duration: FLIGHT, ease: [0.2, 0.7, 0.3, 1] }}
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
  if (game.phase === "over") {
    return <Result game={game} abandoned={game.abandoned} onBack={onBack} />;
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
  const rolled = turn.roll ?? [];
  const choosing = turn.phase === "awaitingSetAside";
  const deciding =
    turn.phase === "awaitingCard" || turn.phase === "awaitingRoll";
  const over = !choosing && !deciding;
  const left = cardsLeft(game.deck);
  // Waiting on a Card means none is in force, whether the Turn has just begun
  // or a TUTTO just spent the last one.
  const shown = turn.phase === "awaitingCard" ? null : turn.card;
  const message = turnMessage(turn);
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
    // `gap-4`, not `gap-6`: eight gaps down this column, and the two rem they
    // gave back are part of what keeps the Card and all six dice above the fold
    // on a 390×844 phone at four Seats with the banner up.
    <div className="flex flex-1 flex-col gap-4">
      {/* The table's top: what the Turn is worth, the deck, and the Card that
          came off it — face-down pile, face-up Card beside it, two piles.
          Three things across 358px of phone, and the split is deliberate. Both
          cards keep their own size, which is not negotiable, and »Im Zug« takes
          what is left: 203px, still the widest thing in the row and 18px more
          than it had. Nothing is squeezed, and the row keeps the height it
          already had, because the pile was always a card tall — so the Card
          costs nothing here and gives up the row it had to itself. Measured at
          390×844 with four Seats and the banner: the dice end 198.4px above the
          fold, where they ended 94.4px above it before.
          The Card sits last, to the right of the deck, so the draw is a hop
          between neighbours. Nothing here says so — the flight measures both. */}
      <div className="flex gap-3 text-center">
        <div className="flex flex-1 flex-col justify-center rounded-xl bg-neutral-500/15 p-3">
          <div className="text-sm opacity-70">Im Zug</div>
          {/* Once the Turn is over its points are banked or forfeited, never at risk. */}
          <div className="text-3xl font-bold">{over ? 0 : turn.score}</div>
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

      {/* What the Card does, full width under the row and holding two lines
          whether or not there is a Card — the longest effects wrap at 390px,
          and a draw that grew this block would shove the dice, the set-aside
          row and both button slots down. */}
      <CardEffect card={shown} />

      {/* Whose Turn it is and what you have, on every phone at the table —
          and every Seat's score one tap behind it. */}
      <Scoreboard game={game} gameId={id} secret={secret} mySeat={mySeat} />

      {game.phase === "finalRound" && (
        <p className="rounded-xl bg-amber-500/25 p-3 text-center font-bold">
          letzte Runde — 6000 sind geknackt. Am Ende gewinnt die höchste
          Punktzahl.
        </p>
      )}

      {/* One line, always the same height, whether or not it has anything to
          say — the news must not shove the table while the Player is aiming.
          Exactly one message, chosen in `turnMessage`, because more than one of
          them can be true at once. A refused move takes the line while it is
          up: it answers the tap just made, and the Turn's own news is still
          there after the next one. */}
      <div className="min-h-14">
        {failed ? (
          <p className="rounded-xl bg-red-500/20 p-3 text-center">
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        ) : (
          message !== null && (
            <p className="text-center text-xl font-bold">{message}</p>
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
          const selectable = myTurn && choosing;
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
                seed={index * 7 + face}
                tumble
                faceClass={isChosen ? chosen : inHand}
              />
            </button>
          );
        })}
        {turn.roll === null &&
          !over &&
          Array.from({ length: turn.diceInHand }, (_, index) => (
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
      <div className="mt-auto flex flex-col gap-3">
        {/* Someone who arrived after the start has no Seat and no move: their
            slot stays empty, holding its height like every other phase. That
            they are watching is said once, in the scoreboard row, which is the
            seam that knows this device has no Seat. */}
        <div className="min-h-14">
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
          {myTurn && turn.phase === "awaitingCard" && (
            <button
              className={primary}
              onClick={act(() => drawCard({ gameId: id, secret: mine }))}
            >
              {/* Rolling on after a Tutto means taking a new Card first. */}
              {turn.tutto ? "weitermachen" : "Karte ziehen"}
            </button>
          )}
          {myTurn && turn.phase === "awaitingRoll" && (
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
        <div className="min-h-14">
          {myTurn && deciding && (
            <button
              className={`${button} bg-neutral-500/25`}
              // A forcing Card takes stopping away: the move is offered dead
              // rather than offered live and refused by the server.
              disabled={!canStop(game)}
              onClick={act(() => stop({ gameId: id, secret: mine }))}
            >
              aufhören
            </button>
          )}
        </div>
        {/* Abandoning ends the Game for everyone, so it is any seated Player's
            move and no Spectator's — and there is nothing gentler on offer:
            no Turn may be skipped and no Seat removed (ADR 0005). */}
        {mySeat !== null && (
          <button
            className="min-h-11 text-sm opacity-70"
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
