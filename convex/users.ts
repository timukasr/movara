import { createClerkClient, type UserJSON } from "@clerk/backend";
import { v, type Validator } from "convex/values";

import { internal } from "./_generated/api";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const getByClerkUserId = internalQuery({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await userByClerkUserId(ctx, args.clerkUserId);
  },
});

export const upsertFromClerk = internalMutation({
  args: {
    data: v.any() as Validator<UserJSON>,
  },
  handler: async (ctx, args) => {
    return await upsertUserRecord(ctx, args.data);
  },
});

export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userByClerkUserId(ctx, args.clerkUserId);

    if (!user) {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${args.clerkUserId}`,
      );
      return null;
    }

    await ctx.db.delete(user._id);
    return null;
  },
});

export const syncUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    const clerkClient = createClerkClient({
      secretKey: getClerkSecretKey(),
    });
    const limit = 100;
    let offset = 0;
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    while (true) {
      const page = await clerkClient.users
        .getUserList({
          limit,
          offset,
        })
        .catch((error: unknown) => {
          throw new Error(
            `Failed to list Clerk users at offset ${offset}: ${formatClerkError(error)}`,
          );
        });

      if (page.data.length === 0) {
        break;
      }

      for (const clerkUser of page.data) {
        const rawUser = clerkUser.raw;

        if (!rawUser) {
          unchanged += 1;
          continue;
        }

        const result = await ctx.runMutation(internal.users.upsertFromClerk, {
          data: rawUser,
        });

        if (result.kind === "inserted") {
          inserted += 1;
          continue;
        }

        if (result.kind === "updated") {
          updated += 1;
          continue;
        }

        unchanged += 1;
      }

      if (page.data.length < limit) {
        break;
      }

      offset += page.data.length;
    }

    return {
      inserted,
      updated,
      unchanged,
      total: inserted + updated + unchanged,
    };
  },
});

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  console.log("identity", identity);

  if (!identity?.subject) {
    return null;
  }

  return await userByClerkUserId(ctx, identity.subject);
}

export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);

  if (!user) {
    throw new Error("Current user has not been synced from Clerk yet.");
  }

  return user;
}

export async function getCurrentUserFromActionOrThrow(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.subject) {
    throw new Error("Current user has not been synced from Clerk yet.");
  }

  const user = await ctx.runQuery(internal.users.getByClerkUserId, {
    clerkUserId: identity.subject,
  });

  if (!user) {
    throw new Error("Current user has not been synced from Clerk yet.");
  }

  return user;
}

async function userByClerkUserId(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

async function upsertUserRecord(ctx: MutationCtx, user: UserJSON) {
  const existing = await userByClerkUserId(ctx, user.id);
  const now = Date.now();
  const nextValues = {
    clerkUserId: user.id,
    name: getDisplayName(user),
    imageUrl: user.image_url ?? null,
    primaryEmail: getPrimaryEmail(user),
  };

  if (existing) {
    const hasChanges =
      existing.name !== nextValues.name ||
      existing.imageUrl !== nextValues.imageUrl ||
      existing.primaryEmail !== nextValues.primaryEmail;

    if (!hasChanges) {
      return { kind: "unchanged", id: existing._id } as const;
    }

    await ctx.db.patch(existing._id, {
      ...nextValues,
      updatedAt: now,
    });
    return { kind: "updated", id: existing._id } as const;
  }

  const id = await ctx.db.insert("users", {
    ...nextValues,
    totalXp: 0,
    createdAt: now,
    updatedAt: now,
  });

  return { kind: "inserted", id } as const;
}

function getDisplayName(user: UserJSON) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return user.username ?? getPrimaryEmail(user) ?? `User ${user.id.slice(-6)}`;
}

function getPrimaryEmail(user: UserJSON) {
  const primaryEmail =
    user.email_addresses.find(
      (emailAddress) => emailAddress.id === user.primary_email_address_id,
    ) ?? user.email_addresses[0];

  return primaryEmail?.email_address ?? null;
}

function getClerkSecretKey() {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing CLERK_SECRET_KEY in Convex env.");
  }

  return secretKey;
}

function formatClerkError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown Clerk error";
  }

  const details = Object.fromEntries(
    Object.getOwnPropertyNames(error).map((key) => [
      key,
      Reflect.get(error, key),
    ]),
  );

  return JSON.stringify({
    message: error.message,
    name: error.name,
    details,
  });
}
