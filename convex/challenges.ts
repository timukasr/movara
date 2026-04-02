import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { type Doc } from "./_generated/dataModel";
import {
  action,
  internalQuery,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

const searchResultValidator = v.object({
  clerkUserId: v.string(),
  displayName: v.string(),
  primaryEmail: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
});

type Challenge = Doc<"challenges">;
type ChallengeMember = Doc<"challengeMembers">;
type SearchResult = {
  clerkUserId: string;
  displayName: string;
  primaryEmail: string | null;
  imageUrl: string | null;
};

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const memberships = await ctx.db
      .query("challengeMembers")
      .withIndex("by_memberClerkUserId", (q) =>
        q.eq("memberClerkUserId", getClerkUserId(identity)),
      )
      .order("desc")
      .take(50);

    const challenges = await Promise.all(
      memberships.map(async (membership) => {
        const challenge = await ctx.db.get(membership.challengeId);

        if (!challenge) {
          return null;
        }

        return {
          id: challenge._id,
          name: challenge.name,
          createdAt: challenge.createdAt,
          role: membership.role,
          memberCount: await getChallengeMemberCount(ctx, challenge._id),
        };
      }),
    );

    return challenges.filter(
      (challenge): challenge is NonNullable<(typeof challenges)[number]> =>
        challenge !== null,
    );
  },
});

export const getOne = query({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      return null;
    }

    const membership = await getChallengeMembership(
      ctx,
      args.challengeId,
      getClerkUserId(identity),
    );

    if (!membership) {
      return null;
    }

    const members = await ctx.db
      .query("challengeMembers")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .take(100);

    members.sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === "owner" ? -1 : 1;
      }

      return left.memberName.localeCompare(right.memberName);
    });

    return {
      id: challenge._id,
      name: challenge.name,
      createdAt: challenge.createdAt,
      canManageMembers:
        challenge.createdByTokenIdentifier === identity.tokenIdentifier,
      members: members.map((member) => ({
        id: member._id,
        clerkUserId: member.memberClerkUserId,
        name: member.memberName,
        imageUrl: member.memberImageUrl,
        role: member.role,
      })),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const challengeId = await ctx.db.insert("challenges", {
      name: normalizeChallengeName(args.name),
      createdByTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
    });

    await ctx.db.insert("challengeMembers", {
      challengeId,
      memberClerkUserId: getClerkUserId(identity),
      memberName: getIdentityDisplayName(identity),
      memberImageUrl: null,
      role: "owner",
      addedByTokenIdentifier: identity.tokenIdentifier,
      addedAt: Date.now(),
    });

    return challengeId;
  },
});

export const addMember = mutation({
  args: {
    challengeId: v.id("challenges"),
    memberClerkUserId: v.string(),
    memberName: v.string(),
    memberImageUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new Error("Challenge not found.");
    }

    if (challenge.createdByTokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Only the challenge owner can add members.");
    }

    if (args.memberClerkUserId === getClerkUserId(identity)) {
      throw new Error("You are already in this challenge.");
    }

    const existingMember = await getChallengeMembership(
      ctx,
      args.challengeId,
      args.memberClerkUserId,
    );

    if (existingMember) {
      throw new Error("That user is already in this challenge.");
    }

    return await ctx.db.insert("challengeMembers", {
      challengeId: args.challengeId,
      memberClerkUserId: args.memberClerkUserId,
      memberName: normalizeMemberName(args.memberName),
      memberImageUrl: args.memberImageUrl,
      role: "member",
      addedByTokenIdentifier: identity.tokenIdentifier,
      addedAt: Date.now(),
    });
  },
});

export const searchClerkUsers = action({
  args: {
    challengeId: v.id("challenges"),
    query: v.string(),
  },
  returns: v.array(searchResultValidator),
  handler: async (ctx, args): Promise<SearchResult[]> => {
    const identity = await requireIdentity(ctx);
    const normalizedQuery = args.query.trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const searchContext: {
      createdByTokenIdentifier: string;
      memberClerkUserIds: string[];
    } | null = await ctx.runQuery(internal.challenges.getSearchContext, {
      challengeId: args.challengeId,
    });

    if (!searchContext) {
      throw new Error("Challenge not found.");
    }

    if (searchContext.createdByTokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Only the challenge owner can search for members.");
    }

    const clerkClient = createClerkClient({
      secretKey: getClerkSecretKey(),
    });
    const users = await clerkClient.users.getUserList({
      query: normalizedQuery,
      limit: 8,
    });
    const excludedClerkUserIds = new Set<string>([
      getClerkUserId(identity),
      ...searchContext.memberClerkUserIds,
    ]);

    return users.data
      .map((user) => ({
        clerkUserId: user.id,
        displayName: getUserDisplayName(user),
        primaryEmail: user.primaryEmailAddress?.emailAddress ?? null,
        imageUrl: user.imageUrl ?? null,
      }))
      .filter((user) => !excludedClerkUserIds.has(user.clerkUserId))
      .slice(0, 8);
  },
});

export const getSearchContext = internalQuery({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      return null;
    }

    const members = await ctx.db
      .query("challengeMembers")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .take(100);

    return {
      createdByTokenIdentifier: challenge.createdByTokenIdentifier,
      memberClerkUserIds: members.map((member) => member.memberClerkUserId),
    };
  },
});

async function requireIdentity(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("You must be signed in.");
  }

  return identity;
}

function getClerkSecretKey() {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing CLERK_SECRET_KEY in Convex env.");
  }

  return secretKey;
}

function getClerkUserId(identity: { subject?: string | null }) {
  if (!identity.subject) {
    throw new Error("Missing Clerk user ID in auth token.");
  }

  return identity.subject;
}

function getIdentityDisplayName(identity: {
  name?: string | null;
  email?: string | null;
  subject?: string | null;
}) {
  return normalizeMemberName(
    identity.name ?? identity.email ?? identity.subject ?? "Challenge owner",
  );
}

function getUserDisplayName(user: {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  id: string;
}) {
  const fullName = user.fullName?.trim();

  if (fullName) {
    return fullName;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  if (name) {
    return name;
  }

  return (
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    `User ${user.id.slice(-6)}`
  );
}

function normalizeChallengeName(name: string) {
  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    throw new Error("Challenge name is required.");
  }

  return normalizedName;
}

function normalizeMemberName(name: string) {
  const normalizedName = name.trim();

  if (normalizedName.length > 0) {
    return normalizedName;
  }

  return "Movara member";
}

async function getChallengeMembership(
  ctx: QueryCtx | MutationCtx,
  challengeId: Challenge["_id"],
  memberClerkUserId: string,
) {
  return await ctx.db
    .query("challengeMembers")
    .withIndex("by_challengeId_and_memberClerkUserId", (q) =>
      q
        .eq("challengeId", challengeId)
        .eq("memberClerkUserId", memberClerkUserId),
    )
    .unique();
}

async function getChallengeMemberCount(
  ctx: QueryCtx,
  challengeId: Challenge["_id"],
) {
  const members: ChallengeMember[] = await ctx.db
    .query("challengeMembers")
    .withIndex("by_challengeId", (q) => q.eq("challengeId", challengeId))
    .take(100);

  return members.length;
}
