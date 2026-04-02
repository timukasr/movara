import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await getCurrentUser(ctx);

    return {
      userId: user?._id ?? null,
      name: user?.name ?? identity.name ?? null,
      email: user?.primaryEmail ?? identity.email ?? null,
    };
  },
});
