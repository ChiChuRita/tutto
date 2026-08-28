import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { MarkWell } from "./Mark";
import { TILE } from "./tiles";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

// A write-in field on a form: a box with a rule round it, and the rule is the
// control grey rather than the printed grid because this is a box that takes
// input. The placeholder is the legend voice, so an empty field reads as a
// caption rather than as text somebody typed and greyed out.
const field =
  "field-live min-h-14 w-full rounded-tile px-3 text-base placeholder:text-muted placeholder:[font-stretch:70%] placeholder:tracking-[0.1em] placeholder:uppercase placeholder:text-[0.7rem]";
// A move not on offer drops to the quiet surface rather than fading — see the
// same class in `Game.tsx` for why a pastel cannot be faded convincingly.
const button =
  "min-h-14 w-full rounded-control px-4 text-lg font-semibold disabled:bg-off disabled:text-off-ink disabled:shadow-none";

/**
 * An account, for the Players who want a record. It is offered and never
 * demanded: everything on the screens around this one works without one, and a
 * guest who ignores it plays a whole Game to the end (ADR 0002).
 *
 * Signing up asks for a name as well as the email and password, because that
 * name is what goes on the Seat and into head-to-head later.
 *
 * Getting in — either way round — hands over the Seats this device holds, and
 * the unowned ones become the account's. Signing in claims them as well as
 * signing up: the Player who made an account on their laptop and has been
 * playing as a guest on their phone is the same person.
 */
export function Account({
  held,
}: {
  held: { gameId: string; secret: string }[];
}) {
  const { signIn, signOut } = useAuthActions();
  const me = useQuery(api.users.me);
  const claimSeats = useMutation(api.games.claimSeats);
  const [signingUp, setSigningUp] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const gettingIn = useRef(false);

  // The claim waits for the account to show up rather than following the
  // sign-in call, because the token reaches the Convex client a render later —
  // a sweep sent any sooner would arrive as a guest and claim nothing. The
  // arrival of the account is itself the render this runs on.
  useEffect(() => {
    if (!gettingIn.current || me == null) return;
    gettingIn.current = false;
    void claimSeats({ held });
  }, [me, held, claimSeats]);

  if (me === undefined) return null;

  if (me !== null) {
    return (
      // Who you are, given the room a name deserves rather than a line of grey
      // text above everything else. It is the first thing on the screen and it
      // is a panel like everything else on it, so the app opens by greeting the
      // Player instead of by listing their admin.
      // The account stub: a named field with the Player's name filled in, which
      // is what the top of a slip looks like once somebody has written on it.
      // The legend says which field this is and the value is the entry — the
      // same two-part shape every other figure in this app now takes.
      <div className="field flex items-center gap-3 rounded-tile p-3">
        <MarkWell name={TILE.player.mark} className={TILE.player.well} />
        <div className="min-w-0 flex-1">
          <div className="legend text-[0.55rem]">Angemeldet als</div>
          <div className="truncate font-display text-lg font-bold">
            {me.name}
          </div>
        </div>
        <button
          className="legend shrink-0 text-[0.7rem] underline"
          onClick={() => void signOut()}
        >
          Abmelden
        </button>
      </div>
    );
  }

  return (
    // A disclosure rather than a screen of its own: the form is the detour, and
    // the Players who never open it are the ones the app is built around.
    <details className="text-sm">
      {/* The list marker is off and nothing is drawn in its place. What was
          there was the browser's own ▶ — a platform artifact in ink, on a page
          where every other line is drawn by this app, and the one thing on the
          start screen that looked unfinished. What is left says what it does
          and is underlined like »Übersicht«, which is the app's other quiet
          control: one vocabulary for both. */}
      <summary className="legend w-fit cursor-pointer list-none text-[0.7rem] underline [&::-webkit-details-marker]:hidden">
        Anmelden oder Konto anlegen
      </summary>
      {/* What an account is for, said next to the control that offers one. This
          sentence used to render from `Stats.tsx`, which placed it further down the
          column and below »Neues Spiel« — a caption three blocks from its subject.
          Inside the disclosure it reads as the answer to »why would I?«, and a
          Player who never opens the disclosure never has to read it at all. */}
      <p className="mt-2 text-sm text-muted">
        Mit einem Konto merkt sich Tutto deine Ergebnisse: dein bester Zug und
        deine Bilanz gegen jeden Mitspieler.
      </p>
      <form
        className="mt-3 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          form.set("flow", signingUp ? "signUp" : "signIn");
          setFailed(false);
          setBusy(true);
          void signIn("password", form)
            .then(() => {
              gettingIn.current = true;
            })
            .catch(() => setFailed(true))
            .finally(() => setBusy(false));
        }}
      >
        {signingUp && (
          <input
            className={field}
            name="name"
            required
            maxLength={40}
            placeholder="Name"
            aria-label="Name"
          />
        )}
        <input
          className={field}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="E-Mail"
          aria-label="E-Mail"
        />
        <input
          className={field}
          name="password"
          type="password"
          required
          // What the provider itself demands, said before the attempt fails.
          minLength={8}
          autoComplete={signingUp ? "new-password" : "current-password"}
          placeholder="Passwort"
          aria-label="Passwort"
        />
        {/* Said before the Player expects otherwise, not after they miss a
            Game: what is claimed is what this browser played (ADR 0004). */}
        <p className="text-sm text-muted">
          Deine bisherigen Spiele auf diesem Gerät werden deinem Konto
          zugeordnet. Spiele von anderen Geräten lassen sich nicht übernehmen.
        </p>
        {/* A refusal, and on this ground it is not a red panel — there is no red.
            It is the field reversed out, which is how the sheet says »this one«
            everywhere else, with the reason in it. `role="alert"` so it is
            announced rather than merely appearing. */}
        {failed && (
          <p
            role="alert"
            className="reversed rounded-tile p-3 text-center text-sm"
          >
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        )}
        <button
          className={`${button} bg-azure text-base tracking-[0.12em] text-on-accent uppercase [font-stretch:88%] pressable`}
          type="submit"
          disabled={busy}
        >
          {signingUp ? "Konto anlegen" : "Anmelden"}
        </button>
        <button
          className="legend min-h-11 text-[0.7rem] underline"
          type="button"
          onClick={() => {
            setSigningUp((up) => !up);
            setFailed(false);
          }}
        >
          {signingUp ? "Ich habe schon ein Konto" : "Neues Konto anlegen"}
        </button>
      </form>
    </details>
  );
}
