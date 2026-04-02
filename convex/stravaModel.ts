import { v } from "convex/values";

import { calculateActivityXp } from "../constants/activity-xp";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";

const importStatusValidator = v.union(
  v.literal("idle"),
  v.literal("running"),
  v.literal("succeeded"),
  v.literal("failed"),
);

const connectionPatchValidator = v.object({
  stravaAthleteId: v.string(),
  athleteDisplayName: v.string(),
  athleteUsername: v.optional(v.string()),
  athleteProfile: v.optional(v.string()),
  grantedScopes: v.array(v.string()),
  accessToken: v.string(),
  refreshToken: v.string(),
  accessTokenExpiresAt: v.number(),
  importStatus: importStatusValidator,
  lastImportError: v.union(v.string(), v.null()),
});

const activityInputValidator = v.object({
  stravaActivityId: v.string(),
  name: v.string(),
  sportType: v.string(),
  type: v.string(),
  distance: v.number(),
  movingTime: v.number(),
  elapsedTime: v.number(),
  totalElevationGain: v.number(),
  startDate: v.string(),
  startDateLocal: v.string(),
  timezone: v.string(),
  isPrivate: v.boolean(),
  averageSpeed: v.optional(v.number()),
});

export const getConnectionForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getConnectionForAthleteId = internalQuery({
  args: {
    stravaAthleteId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stravaConnections")
      .withIndex("by_stravaAthleteId", (q) =>
        q.eq("stravaAthleteId", args.stravaAthleteId),
      )
      .unique();
  },
});

export const upsertConnection = internalMutation({
  args: {
    userId: v.id("users"),
    connection: connectionPatchValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.connection,
      });
      return existing._id;
    }

    return await ctx.db.insert("stravaConnections", {
      userId: args.userId,
      ...args.connection,
    });
  },
});

export const setImportRunning = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) {
      throw new Error("Strava connection not found.");
    }

    await ctx.db.patch(connection._id, {
      importStatus: "running",
      lastImportStartedAt: Date.now(),
      lastImportError: null,
    });
  },
});

export const recordImportFailure = internalMutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) {
      return;
    }

    await ctx.db.patch(connection._id, {
      importStatus: "failed",
      lastImportCompletedAt: Date.now(),
      lastImportError: args.message,
    });
  },
});

export const recordImportSuccess = internalMutation({
  args: {
    userId: v.id("users"),
    importedCount: v.number(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) {
      throw new Error("Strava connection not found.");
    }

    await ctx.db.patch(connection._id, {
      importStatus: "succeeded",
      lastImportCompletedAt: Date.now(),
      lastImportCount: args.importedCount,
      lastImportError: null,
    });
  },
});

export const deleteConnectionForUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) {
      return false;
    }

    await ctx.db.delete(connection._id);
    return true;
  },
});

export const upsertActivitiesPage = internalMutation({
  args: {
    userId: v.id("users"),
    activities: v.array(activityInputValidator),
  },
  handler: async (ctx, args) => {
    for (const activity of args.activities) {
      const activityRecord = createActivityRecord(activity);
      const existing = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_stravaActivityId", (q) =>
          q
            .eq("userId", args.userId)
            .eq("stravaActivityId", activity.stravaActivityId),
        )
        .unique();

      if (existing) {
        await ctx.db.replace(existing._id, {
          userId: args.userId,
          ...activityRecord,
        });
        continue;
      }

      await ctx.db.insert("activities", {
        userId: args.userId,
        ...activityRecord,
      });
    }

    await ctx.runMutation(internal.challenges.recomputeMemberXpForUser, {
      userId: args.userId,
    });
    await ctx.runMutation(internal.users.recomputeTotalXpForUser, {
      userId: args.userId,
    });

    return args.activities.length;
  },
});

export const clearActivitiesPage = internalMutation({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("activities")
      .withIndex("by_userId_and_startDate", (q) => q.eq("userId", args.userId))
      .take(args.limit);

    for (const activity of batch) {
      await ctx.db.delete(activity._id);
    }

    return batch.length;
  },
});

export const deleteActivityByStravaId = internalMutation({
  args: {
    userId: v.id("users"),
    stravaActivityId: v.string(),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_userId_and_stravaActivityId", (q) =>
        q
          .eq("userId", args.userId)
          .eq("stravaActivityId", args.stravaActivityId),
      )
      .unique();

    if (!activity) {
      return false;
    }

    await ctx.db.delete(activity._id);
    await ctx.runMutation(internal.challenges.recomputeMemberXpForUser, {
      userId: args.userId,
    });
    await ctx.runMutation(internal.users.recomputeTotalXpForUser, {
      userId: args.userId,
    });

    return true;
  },
});

function createActivityRecord(activity: {
  stravaActivityId: string;
  name: string;
  sportType: string;
  type: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  startDate: string;
  startDateLocal: string;
  timezone: string;
  isPrivate: boolean;
  averageSpeed?: number;
}) {
  const xp = calculateActivityXp({
    type: activity.type,
    distanceMeters: activity.distance,
  });

  return {
    ...activity,
    ...(xp === undefined ? {} : { xp }),
  };
}
