import { queryGeneric as query } from "convex/server";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    return {
      subject: identity.subject,
      name: identity.name ?? null,
      email: identity.email ?? null,
      nickname: identity.nickname ?? null,
    };
  },
});
