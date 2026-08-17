import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

const field =
  "min-h-14 w-full rounded-control bg-raised px-4 text-lg placeholder:text-muted";
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
      <div className="flex items-center gap-3 text-sm">
        <span className="flex-1 truncate text-muted">
          Angemeldet als{" "}
          <span className="font-semibold text-ink">{me.name}</span>
        </span>
        <button className="text-muted underline" onClick={() => void signOut()}>
          Abmelden
        </button>
      </div>
    );
  }

  return (
    // A disclosure rather than a screen of its own: the form is the detour, and
    // the Players who never open it are the ones the app is built around.
    <details className="text-sm">
      <summary className="cursor-pointer text-muted">
        Anmelden oder Konto anlegen
      </summary>
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
        <p className="text-muted">
          Deine bisherigen Spiele auf diesem Gerät werden deinem Konto
          zugeordnet. Spiele von anderen Geräten lassen sich nicht übernehmen.
        </p>
        {failed && (
          <p className="rounded-tile bg-raised p-3 text-center text-alarm">
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        )}
        <button
          className={`${button} bg-azure text-on-accent pressable`}
          type="submit"
          disabled={busy}
        >
          {signingUp ? "Konto anlegen" : "Anmelden"}
        </button>
        <button
          className="min-h-11 text-muted underline"
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
