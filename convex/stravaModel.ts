import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

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

export const getConnectionForToken = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
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
      .withIndex("by_stravaAthleteId", (q) => q.eq("stravaAthleteId", args.stravaAthleteId))
      .unique();
  },
});

export const upsertConnection = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    connection: connectionPatchValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.connection,
      });
      return existing._id;
    }

    return await ctx.db.insert("stravaConnections", {
      tokenIdentifier: args.tokenIdentifier,
      ...args.connection,
    });
  },
});

export const setImportRunning = internalMutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
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
    tokenIdentifier: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
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
    tokenIdentifier: v.string(),
    importedCount: v.number(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
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

export const deleteConnectionForToken = internalMutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
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
    tokenIdentifier: v.string(),
    activities: v.array(activityInputValidator),
  },
  handler: async (ctx, args) => {
    for (const activity of args.activities) {
      const existing = await ctx.db
        .query("stravaActivities")
        .withIndex("by_tokenIdentifier_and_stravaActivityId", (q) =>
          q
            .eq("tokenIdentifier", args.tokenIdentifier)
            .eq("stravaActivityId", activity.stravaActivityId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, activity);
        continue;
      }

      await ctx.db.insert("stravaActivities", {
        tokenIdentifier: args.tokenIdentifier,
        ...activity,
      });
    }

    return args.activities.length;
  },
});

export const clearActivitiesPage = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("stravaActivities")
      .withIndex("by_tokenIdentifier_and_startDate", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .take(args.limit);

    for (const activity of batch) {
      await ctx.db.delete(activity._id);
    }

    return batch.length;
  },
});

export const deleteActivityByStravaId = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    stravaActivityId: v.string(),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("stravaActivities")
      .withIndex("by_tokenIdentifier_and_stravaActivityId", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier).eq("stravaActivityId", args.stravaActivityId),
      )
      .unique();

    if (!activity) {
      return false;
    }

    await ctx.db.delete(activity._id);
    return true;
  },
});
