import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * An account is worth having at exactly one moment before the stats exist: the
 * Player takes their Seat under their profile name without typing anything.
 * Everything else here still works with no account at all (ADR 0002).
 */

/**
 * The User making this call, or `null` for a guest. Who is calling is never an
 * argument — it comes from the token and from nowhere else.
 */
export async function signedInUser(
  ctx: QueryCtx,
): Promise<{ id: Id<"users">; name: string } | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const user = await ctx.db.get("users", userId);
  if (user === null) return null;
  // Signing up asks for a name, so there is always one. An account without one
  // has nothing to be called at the table, and a nameless Seat is refused —
  // the email is not a fallback, it is not for the other Players to see.
  return { id: user._id, name: user.name ?? "" };
}

/** Who is signed in on this device, for the screens that greet them by name. */
export const me = query({
  args: {},
  returns: v.union(v.null(), v.object({ name: v.string() })),
  handler: async (ctx) => {
    const user = await signedInUser(ctx);
    return user === null ? null : { name: user.name };
  },
});
