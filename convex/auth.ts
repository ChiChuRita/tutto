import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";

/**
 * Email and a password, and nothing else: magic links and third-party sign-in
 * were both rejected, each for infrastructure a path most Players skip.
 *
 * Sign-up asks for a display name on top of the two, because head-to-head has
 * to print something and the provider hands us only an email — which is not a
 * thing to put on the table in front of everybody.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      // Called for every flow, but only what creating an account returns is
      // ever stored — signing in later must not have to repeat the name.
      profile: (params) => {
        const { email, name, flow } = params;
        if (typeof email !== "string" || email.trim() === "") {
          throw new Error("An account is made under an email address");
        }
        const given = typeof name === "string" ? name.trim() : "";
        if (flow === "signUp" && given === "") {
          throw new Error("An account is made under a display name");
        }
        return { email: email.trim(), name: given };
      },
    }),
  ],
});
