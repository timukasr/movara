import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";

import { scaleDisplayedXp } from "../constants/activity-xp";
import { internal } from "./_generated/api";
import { type Doc } from "./_generated/dataModel";
import {
  action,
  internalMutation,
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
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

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
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

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
      if (left.currentXp !== right.currentXp) {
        return right.currentXp - left.currentXp;
      }

      if (left.role !== right.role) {
        return left.role === "owner" ? -1 : 1;
      }

      return left.memberName.localeCompare(right.memberName);
    });

    return {
      id: challenge._id,
      name: challenge.name,
      goalXp: challenge.goalXp,
      startAt: challenge.startAt,
      endAt: challenge.endAt,
      createdAt: challenge.createdAt,
      canManageMembers:
        challenge.createdByTokenIdentifier === identity.tokenIdentifier,
      members: members.map((member) => ({
        id: member._id,
        clerkUserId: member.memberClerkUserId,
        name: member.memberName,
        imageUrl: member.memberImageUrl,
        role: member.role,
        currentXp: member.currentXp,
      })),
    };
  },
});

export const getActivityFeed = query({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      return [];
    }

    const membership = await getChallengeMembership(
      ctx,
      args.challengeId,
      getClerkUserId(identity),
    );

    if (!membership) {
      return [];
    }

    const members = await ctx.db
      .query("challengeMembers")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .take(100);

    type FeedItem =
      | {
          kind: "activity";
          id: string;
          memberName: string;
          name: string;
          sportType: string;
          distance: number;
          movingTime: number;
          startDateLocal: string;
          timestamp: number;
          xp: number | undefined;
        }
      | {
          kind: "message";
          id: string;
          memberName: string;
          text: string;
          timestamp: number;
        };

    const feedItems: FeedItem[] = [];

    // Collect activities
    for (const member of members) {
      const connection = await ctx.db
        .query("stravaConnections")
        .withIndex("by_clerkUserId", (q) =>
          q.eq("clerkUserId", member.memberClerkUserId),
        )
        .unique();

      if (!connection) {
        continue;
      }

      for await (const activity of ctx.db
        .query("stravaActivities")
        .withIndex("by_tokenIdentifier_and_startDate", (q) =>
          q.eq("tokenIdentifier", connection.tokenIdentifier),
        )
        .order("desc")) {
        const activityTimestamp = Date.parse(activity.startDate);

        if (
          Number.isNaN(activityTimestamp) ||
          activityTimestamp < challenge.startAt
        ) {
          break;
        }

        if (activityTimestamp > challenge.endAt) {
          continue;
        }

        feedItems.push({
          kind: "activity",
          id: activity._id,
          memberName: member.memberName,
          name: activity.name,
          sportType: activity.sportType,
          distance: activity.distance,
          movingTime: activity.movingTime,
          startDateLocal: activity.startDateLocal,
          timestamp: activityTimestamp,
          xp: activity.xp,
        });
      }
    }

    // Collect messages
    const messages = await ctx.db
      .query("challengeMessages")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    for (const message of messages) {
      feedItems.push({
        kind: "message",
        id: message._id,
        memberName: message.memberName,
        text: message.text,
        timestamp: message._creationTime,
      });
    }

    feedItems.sort((a, b) => a.timestamp - b.timestamp);

    return feedItems.slice(0, 50);
  },
});

export const sendMessage = mutation({
  args: {
    challengeId: v.id("challenges"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const clerkUserId = getClerkUserId(identity);

    const membership = await getChallengeMembership(
      ctx,
      args.challengeId,
      clerkUserId,
    );

    if (!membership) {
      throw new Error("You are not a member of this challenge.");
    }

    const trimmedText = args.text.trim();

    if (trimmedText.length === 0) {
      throw new Error("Message cannot be empty.");
    }

    await ctx.db.insert("challengeMessages", {
      challengeId: args.challengeId,
      memberClerkUserId: clerkUserId,
      memberName: membership.memberName,
      text: trimmedText,
    });
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
    const identity = await requireIdentity(ctx);
    const { startAt, endAt } = normalizeChallengeRange(args);
    const clerkUserId = getClerkUserId(identity);
    const currentXp = await getXpForDateRange(ctx, clerkUserId, startAt, endAt);
    const challengeId = await ctx.db.insert("challenges", {
      name: normalizeChallengeName(args.name),
      goalXp: normalizeGoalXp(args.goalXp),
      startAt,
      endAt,
      createdByTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
    });

    await ctx.db.insert("challengeMembers", {
      challengeId,
      memberClerkUserId: clerkUserId,
      memberName: getIdentityDisplayName(identity),
      memberImageUrl: null,
      role: "owner",
      currentXp,
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

    const currentXp = await getXpForDateRange(
      ctx,
      args.memberClerkUserId,
      challenge.startAt,
      challenge.endAt,
    );

    return await ctx.db.insert("challengeMembers", {
      challengeId: args.challengeId,
      memberClerkUserId: args.memberClerkUserId,
      memberName: normalizeMemberName(args.memberName),
      memberImageUrl: args.memberImageUrl,
      role: "member",
      currentXp,
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

export const recomputeMemberXpForClerkUser = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("challengeMembers")
      .withIndex("by_memberClerkUserId", (q) =>
        q.eq("memberClerkUserId", args.clerkUserId),
      )
      .take(100);

    if (memberships.length === 0) {
      return 0;
    }

    const currentXpByMembershipId = await getCurrentXpByMembershipId(
      ctx,
      memberships,
      args.clerkUserId,
    );

    for (const membership of memberships) {
      await ctx.db.patch(membership._id, {
        currentXp: currentXpByMembershipId[membership._id] ?? 0,
      });
    }

    return memberships.length;
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

async function getXpForDateRange(
  ctx: MutationCtx,
  clerkUserId: string,
  startAt: number,
  endAt: number,
) {
  const connection = await ctx.db
    .query("stravaConnections")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();

  if (!connection) {
    return 0;
  }

  let totalXp = 0;

  for await (const activity of ctx.db
    .query("stravaActivities")
    .withIndex("by_tokenIdentifier_and_startDate", (q) =>
      q.eq("tokenIdentifier", connection.tokenIdentifier),
    )) {
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
  clerkUserId: string,
) {
  const currentXpByMembershipId: Record<string, number> = {};

  for (const membership of memberships) {
    currentXpByMembershipId[membership._id] = 0;
  }

  const connection = await ctx.db
    .query("stravaConnections")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
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
    .withIndex("by_tokenIdentifier_and_startDate", (q) =>
      q.eq("tokenIdentifier", connection.tokenIdentifier),
    )) {
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
