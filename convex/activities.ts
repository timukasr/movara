import { v } from "convex/values";

import { calculateActivityXp } from "../constants/activity-xp";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const create = mutation({
  args: {
    name: v.string(),
    sportType: v.string(),
    distance: v.number(),
    movingTime: v.number(),
    startDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const trimmedName = args.name.trim();

    if (trimmedName.length === 0) {
      throw new Error("Activity name cannot be empty.");
    }

    const startDate = args.startDate ?? new Date().toISOString();
    const distance = Math.max(0, args.distance);
    const xp = calculateActivityXp({
      type: args.sportType,
      distanceMeters: distance,
    });

    const id = await ctx.db.insert("activities", {
      userId: currentUser._id,
      name: trimmedName,
      sportType: args.sportType,
      distance,
      movingTime: Math.max(0, Math.round(args.movingTime)),
      startDate,
      startDateLocal: startDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      xp,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.challenges.recomputeMemberXpForUser,
      {
        userId: currentUser._id,
      },
    );

    return id;
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_userId_and_startDate", (q) =>
        q.eq("userId", currentUser._id),
      )
      .order("desc")
      .take(20);

    return activities.map((activity) => ({
      id: activity._id,
      stravaActivityId: activity.stravaActivityId ?? null,
      name: activity.name,
      sportType: activity.sportType,
      type: activity.type ?? null,
      distance: activity.distance,
      movingTime: activity.movingTime,
      elapsedTime: activity.elapsedTime ?? null,
      totalElevationGain: activity.totalElevationGain ?? null,
      startDate: activity.startDate,
      startDateLocal: activity.startDateLocal ?? activity.startDate,
      timezone: activity.timezone ?? null,
      isPrivate: activity.isPrivate ?? false,
      xp: activity.xp ?? null,
      averageSpeed: activity.averageSpeed ?? null,
    }));
  },
});

export const getOne = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const activity = await ctx.db.get(args.id);

    if (!activity || activity.userId !== currentUser._id) {
      return null;
    }

    return {
      id: activity._id,
      stravaActivityId: activity.stravaActivityId ?? null,
      name: activity.name,
      sportType: activity.sportType,
      type: activity.type ?? activity.sportType,
      distance: activity.distance,
      movingTime: activity.movingTime,
      elapsedTime: activity.elapsedTime ?? null,
      totalElevationGain: activity.totalElevationGain ?? null,
      startDate: activity.startDate,
      startDateLocal: activity.startDateLocal ?? activity.startDate,
      timezone: activity.timezone ?? null,
      isPrivate: activity.isPrivate ?? false,
      xp: activity.xp ?? null,
      averageSpeed: activity.averageSpeed ?? null,
    };
  },
});
