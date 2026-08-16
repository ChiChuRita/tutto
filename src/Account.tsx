import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

const field = "min-h-14 w-full rounded-xl bg-neutral-500/15 px-4 text-lg";
const button =
  "min-h-14 w-full rounded-xl px-4 text-lg font-semibold disabled:opacity-40";

/**
 * An account, for the Players who want a record. It is offered and never
 * demanded: everything on the screens around this one works without one, and a
 * guest who ignores it plays a whole Game to the end (ADR 0002).
 *
 * Signing up asks for a name as well as the email and password, because that
 * name is what goes on the Seat and into head-to-head later.
 */
export function Account() {
  const { signIn, signOut } = useAuthActions();
  const me = useQuery(api.users.me);
  const [signingUp, setSigningUp] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (me === undefined) return null;

  if (me !== null) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="flex-1 truncate opacity-70">
          Angemeldet als <span className="font-semibold">{me.name}</span>
        </span>
        <button className="underline opacity-70" onClick={() => void signOut()}>
          Abmelden
        </button>
      </div>
    );
  }

  return (
    // A disclosure rather than a screen of its own: the form is the detour, and
    // the Players who never open it are the ones the app is built around.
    <details className="text-sm">
      <summary className="cursor-pointer opacity-70">
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
        {failed && (
          <p className="rounded-xl bg-red-500/20 p-3 text-center">
            Das hat nicht geklappt. Bitte nochmal.
          </p>
        )}
        <button
          className={`${button} bg-blue-600 text-white`}
          type="submit"
          disabled={busy}
        >
          {signingUp ? "Konto anlegen" : "Anmelden"}
        </button>
        <button
          className="min-h-11 underline opacity-70"
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
