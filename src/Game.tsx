import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  canStop,
  cardsLeft,
  scoreSelection,
  seatMayPlay,
  winners,
  type GameState,
  type Seat,
} from "./game/turn";
import { Die } from "./Die";
import { Lobby } from "./Lobby";
import { turnMessage } from "./message";
import { CardEffect, CardStack, DrawnCard, EmptyCardSlot } from "./Card";

const button =
  "min-h-14 w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";
const primary = `${button} bg-blue-600 text-white`;

/**
 * Every die in a Roll looks the same. Which of them score is the Player's to
 * work out — it is most of the skill in Tutto — so the only thing a die says is
 * whether the Player has picked it up.
 */
const inHand = "bg-neutral-50 text-neutral-900";
const chosen = "bg-blue-600 text-white";

/**
 * The whole table on every phone: what each Seat has banked, and which of them
 * is rolling. Everyone sees the same list — Tutto hides nothing but the undrawn
 * deck, so a Spectator's scoreboard is a Player's scoreboard.
 */
function Scoreboard({
  seats,
  activeSeatIndex,
  mySeat,
}: {
  seats: Seat[];
  activeSeatIndex: number;
  /** This device's Seat, or `null` for a Spectator. */
  mySeat: number | null;
}) {
  return (
    // One wrapped row rather than a row per Seat. At four Seats the row-per-Seat
    // version cost about 96px, which is what the Card and the sixth die needed
    // to stay above the fold on a 390×844 phone with the »letzte Runde« banner
    // up. Wrapping means the height still grows with the table, just far slower.
    <ul className="flex flex-wrap justify-center gap-1">
      {seats.map((seat, index) => (
        <li
          key={index}
          className={`flex min-w-0 gap-2 rounded-lg px-3 py-1 ${
            index === activeSeatIndex
              ? "bg-blue-600/25 font-bold"
              : "bg-neutral-500/10"
          }`}
        >
          <span className="truncate">
            {seat.name}
            {/* Which of these is you, on a table of names you chose yourself. */}
            {index === mySeat && <span className="font-normal"> (du)</span>}
          </span>
          <span>{seat.score}</span>
        </li>
      ))}
    </ul>
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
  // The pile, so a drawn Card can measure where it is flying from. It sits in
  // the stat row and the Card lands well below it, with the »letzte Runde«
  // banner sometimes between them — which is why the gap is measured.
  const pile = useRef<HTMLDivElement>(null);

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
  const active = game.seats[game.activeSeatIndex];
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
      <div className="flex gap-3 text-center">
        <div className="flex-1 rounded-xl bg-neutral-500/15 p-3">
          <div className="text-sm opacity-70">Im Zug</div>
          {/* Once the Turn is over its points are banked or forfeited, never at risk. */}
          <div className="text-3xl font-bold">{over ? 0 : turn.score}</div>
        </div>
        <CardStack left={left} ref={pile} />
      </div>

      <Scoreboard
        seats={game.seats}
        activeSeatIndex={game.activeSeatIndex}
        mySeat={mySeat}
      />

      {/* Whose Turn it is, by name, on every phone at the table. */}
      <p className="text-center text-lg font-semibold">
        {myTurn ? "Du bist am Zug." : `${active.name} ist am Zug.`}
      </p>

      {game.phase === "finalRound" && (
        <p className="rounded-xl bg-amber-500/25 p-3 text-center font-bold">
          letzte Runde — 6000 sind geknackt. Am Ende gewinnt die höchste
          Punktzahl.
        </p>
      )}

      {/* A Card owed is a Card gone: at the start of a Turn there is none yet,
          and after a TUTTO the old one is spent even though the position still
          carries it. Either way the slot stands empty until the next draw.
          The key is what mounts a fresh element, and so what plays the draw —
          every draw takes one Card out of the deck, so the count always moves. */}
      {/* The slot and the sentence under it are one block, because the sentence
          is what the Card in the slot means. It renders whether or not there is
          a Card and holds two lines either way — otherwise every draw would add
          a line here and push the dice, the set-aside row and both button slots
          down, which is exactly what reserving space is meant to stop. */}
      <div>
        {shown === null ? (
          <EmptyCardSlot />
        ) : (
          <DrawnCard key={`${shown}-${left}`} card={shown} pile={pile} />
        )}
        <CardEffect card={shown} />
      </div>

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
      <div className="grid grid-cols-3 grid-rows-[repeat(2,var(--die-box))] justify-items-center">
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
      <div>
        <div className="text-sm opacity-70">Herausgelegt</div>
        {/* Set aside and out of play: smaller, darker, and never rerolled.
            These never tumble, so they need no room to sweep through and their
            box is just the die. */}
        <div className="flex min-h-9 flex-wrap gap-2 [--die-box:2.25rem] [--die-size:2.25rem]">
          {turn.setAside.map((face, index) => (
            <Die
              key={index}
              face={face}
              seed={index}
              tumble={false}
              faceClass="bg-neutral-700 text-neutral-200"
            />
          ))}
        </div>
      </div>

      {/* The moves belong to the Seat whose Turn it is. Everyone else has the
          same screen without them, and watches the Turn play out on it.
          Two slots, and they keep their height in every phase and for every
          Seat: the move this phase offers, then »aufhören«. What changes
          between taps is what sits in a slot, never where the slot is — so a
          thumb already on its way down lands on what it was aiming at. */}
      <div className="mt-auto flex flex-col gap-3">
        <div className="min-h-14">
          {/* Someone who arrived after the start has no Seat and nothing to take
              one with — the table above is the whole of what they came for. */}
          {mySeat === null && (
            <p className="text-center opacity-70">Du schaust zu.</p>
          )}
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
