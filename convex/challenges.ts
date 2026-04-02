import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";

import { scaleDisplayedXp } from "../constants/activity-xp";
import { internal } from "./_generated/api";
import { type Doc, type Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  getCurrentUserFromActionOrThrow,
  getCurrentUserOrThrow,
} from "./users";

const searchResultValidator = v.object({
  userId: v.id("users"),
  displayName: v.string(),
  primaryEmail: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
});

type Challenge = Doc<"challenges">;
type ChallengeMember = Doc<"challengeMembers">;
type SearchResult = {
  userId: Id<"users">;
  displayName: string;
  primaryEmail: string | null;
  imageUrl: string | null;
};

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const memberships = await ctx.db
      .query("challengeMembers")
      .withIndex("by_memberUserId", (q) =>
        q.eq("memberUserId", currentUser._id),
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
          goalXp: challenge.goalXp,
          startAt: challenge.startAt,
          endAt: challenge.endAt,
          currentXp: membership.currentXp,
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
    const currentUser = await getCurrentUserOrThrow(ctx);
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      return null;
    }

    const membership = await getChallengeMembership(
      ctx,
      args.challengeId,
      currentUser._id,
    );

    if (!membership) {
      return null;
    }

    const members = await ctx.db
      .query("challengeMembers")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .take(100);
    const hydratedMembers = await Promise.all(
      members.map((member) => hydrateMember(ctx, member)),
    );

    hydratedMembers.sort((left, right) => {
      if (left.currentXp !== right.currentXp) {
        return right.currentXp - left.currentXp;
      }

      if (left.role !== right.role) {
        return left.role === "owner" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });

    return {
      id: challenge._id,
      name: challenge.name,
      goalXp: challenge.goalXp,
      startAt: challenge.startAt,
      endAt: challenge.endAt,
      createdAt: challenge.createdAt,
      canManageMembers: challenge.createdByUserId === currentUser._id,
      members: hydratedMembers,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    goalXp: v.number(),
    startAt: v.number(),
    endAt: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const { startAt, endAt } = normalizeChallengeRange(args);
    const currentXp = await getXpForDateRange(
      ctx,
      currentUser._id,
      startAt,
      endAt,
    );
    const challengeId = await ctx.db.insert("challenges", {
      name: normalizeChallengeName(args.name),
      goalXp: normalizeGoalXp(args.goalXp),
      startAt,
      endAt,
      createdByUserId: currentUser._id,
      createdAt: Date.now(),
    });

    await ctx.db.insert("challengeMembers", {
      challengeId,
      memberUserId: currentUser._id,
      role: "owner",
      currentXp,
      addedByUserId: currentUser._id,
      addedAt: Date.now(),
    });

    return challengeId;
  },
});

export const addMember = mutation({
  args: {
    challengeId: v.id("challenges"),
    memberUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new Error("Challenge not found.");
    }

    if (challenge.createdByUserId !== currentUser._id) {
      throw new Error("Only the challenge owner can add members.");
    }

    if (args.memberUserId === currentUser._id) {
      throw new Error("You are already in this challenge.");
    }

    const memberUser = await ctx.db.get(args.memberUserId);

    if (!memberUser) {
      throw new Error("User not found.");
    }

    const existingMember = await getChallengeMembership(
      ctx,
      args.challengeId,
      memberUser._id,
    );

    if (existingMember) {
      throw new Error("That user is already in this challenge.");
    }

    const currentXp = await getXpForDateRange(
      ctx,
      memberUser._id,
      challenge.startAt,
      challenge.endAt,
    );

    return await ctx.db.insert("challengeMembers", {
      challengeId: args.challengeId,
      memberUserId: memberUser._id,
      role: "member",
      currentXp,
      addedByUserId: currentUser._id,
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
    const currentUser = await getCurrentUserFromActionOrThrow(ctx);
    const normalizedQuery = args.query.trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const searchContext: {
      createdByUserId: Id<"users">;
      memberUserIds: Id<"users">[];
    } | null = await ctx.runQuery(internal.challenges.getSearchContext, {
      challengeId: args.challengeId,
    });

    if (!searchContext) {
      throw new Error("Challenge not found.");
    }

    if (searchContext.createdByUserId !== currentUser._id) {
      throw new Error("Only the challenge owner can search for members.");
    }

    const clerkClient = createClerkClient({
      secretKey: getClerkSecretKey(),
    });
    const users = await clerkClient.users.getUserList({
      query: normalizedQuery,
      limit: 8,
    });
    const memberUserIds = new Set<Id<"users">>(searchContext.memberUserIds);
    const results: SearchResult[] = [];

    for (const user of users.data) {
      if (!user.raw) {
        continue;
      }

      const upserted = await ctx.runMutation(internal.users.upsertFromClerk, {
        data: user.raw,
      });

      if (upserted.id === currentUser._id || memberUserIds.has(upserted.id)) {
        continue;
      }

      results.push({
        userId: upserted.id,
        displayName: getUserDisplayName(user),
        primaryEmail: user.primaryEmailAddress?.emailAddress ?? null,
        imageUrl: user.imageUrl ?? null,
      });

      if (results.length === 8) {
        break;
      }
    }

    return results;
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
      createdByUserId: challenge.createdByUserId,
      memberUserIds: members.map((member) => member.memberUserId),
    };
  },
});

export const recomputeMemberXpForUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("challengeMembers")
      .withIndex("by_memberUserId", (q) => q.eq("memberUserId", args.userId))
      .take(100);

    if (memberships.length === 0) {
      return 0;
    }

    const currentXpByMembershipId = await getCurrentXpByMembershipId(
      ctx,
      memberships,
      args.userId,
    );

    for (const membership of memberships) {
      await ctx.db.patch(membership._id, {
        currentXp: currentXpByMembershipId[membership._id] ?? 0,
      });
    }

    return memberships.length;
  },
});

function getClerkSecretKey() {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing CLERK_SECRET_KEY in Convex env.");
  }

  return secretKey;
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

function normalizeGoalXp(goalXp: number) {
  if (!Number.isFinite(goalXp) || goalXp <= 0) {
    throw new Error("Challenge goal XP must be greater than 0.");
  }

  return scaleDisplayedXp(goalXp);
}

function normalizeChallengeRange(args: { startAt: number; endAt: number }) {
  if (!Number.isFinite(args.startAt) || !Number.isFinite(args.endAt)) {
    throw new Error("Challenge dates are required.");
  }

  if (args.endAt < args.startAt) {
    throw new Error("Challenge end date must be on or after the start date.");
  }

  return {
    startAt: args.startAt,
    endAt: args.endAt,
  };
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
  userId: Id<"users">,
) {
  return await ctx.db
    .query("challengeMembers")
    .withIndex("by_challengeId_and_memberUserId", (q) =>
      q.eq("challengeId", challengeId).eq("memberUserId", userId),
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

async function getXpForDateRange(
  ctx: MutationCtx,
  userId: Id<"users">,
  startAt: number,
  endAt: number,
) {
  const connection = await ctx.db
    .query("stravaConnections")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (!connection) {
    return 0;
  }

  let totalXp = 0;

  for await (const activity of ctx.db
    .query("stravaActivities")
    .withIndex("by_userId_and_startDate", (q) => q.eq("userId", userId))) {
    const activityXp = activity.xp;
    const activityTimestamp = Date.parse(activity.startDate);

    if (
      activityXp === undefined ||
      Number.isNaN(activityTimestamp) ||
      activityTimestamp < startAt ||
      activityTimestamp > endAt
    ) {
      continue;
    }

    totalXp += activityXp;
  }

  return totalXp;
}

async function getCurrentXpByMembershipId(
  ctx: MutationCtx,
  memberships: ChallengeMember[],
  userId: Id<"users">,
) {
  const currentXpByMembershipId: Record<string, number> = {};

  for (const membership of memberships) {
    currentXpByMembershipId[membership._id] = 0;
  }

  const connection = await ctx.db
    .query("stravaConnections")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (!connection) {
    return currentXpByMembershipId;
  }

  const challengeById = new Map<
    Challenge["_id"],
    Pick<Challenge, "_id" | "startAt" | "endAt">
  >();

  for (const membership of memberships) {
    const challenge = await ctx.db.get(membership.challengeId);

    if (!challenge) {
      continue;
    }

    challengeById.set(challenge._id, challenge);
  }

  for await (const activity of ctx.db
    .query("stravaActivities")
    .withIndex("by_userId_and_startDate", (q) => q.eq("userId", userId))) {
    const activityXp = activity.xp;
    const activityTimestamp = Date.parse(activity.startDate);

    if (activityXp === undefined || Number.isNaN(activityTimestamp)) {
      continue;
    }

    for (const membership of memberships) {
      const challenge = challengeById.get(membership.challengeId);

      if (!challenge) {
        continue;
      }

      if (
        activityTimestamp >= challenge.startAt &&
        activityTimestamp <= challenge.endAt
      ) {
        currentXpByMembershipId[membership._id] += activityXp;
      }
    }
  }

  return currentXpByMembershipId;
}

async function hydrateMember(ctx: QueryCtx, member: ChallengeMember) {
  const user = await ctx.db.get(member.memberUserId);

  return {
    id: member._id,
    userId: member.memberUserId,
    name: normalizeMemberName(user?.name ?? "Movara member"),
    imageUrl: user?.imageUrl ?? null,
    role: member.role,
    currentXp: member.currentXp,
  };
}
