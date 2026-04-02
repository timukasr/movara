import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    imageUrl: v.union(v.string(), v.null()),
    primaryEmail: v.union(v.string(), v.null()),
    totalXp: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkUserId", ["clerkUserId"]),

  challenges: defineTable({
    name: v.string(),
    goalXp: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
  }).index("by_createdByUserId", ["createdByUserId"]),

  challengeMembers: defineTable({
    challengeId: v.id("challenges"),
    memberUserId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    currentXp: v.number(),
    addedByUserId: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_challengeId", ["challengeId"])
    .index("by_memberUserId", ["memberUserId"])
    .index("by_challengeId_and_memberUserId", ["challengeId", "memberUserId"]),

  challengeMessages: defineTable({
    challengeId: v.id("challenges"),
    memberClerkUserId: v.string(),
    memberName: v.string(),
    text: v.string(),
  }).index("by_challengeId", ["challengeId"]),

  stravaConnections: defineTable({
    userId: v.id("users"),
    stravaAthleteId: v.string(),
    athleteDisplayName: v.string(),
    athleteUsername: v.optional(v.string()),
    athleteProfile: v.optional(v.string()),
    grantedScopes: v.array(v.string()),
    accessToken: v.string(),
    refreshToken: v.string(),
    accessTokenExpiresAt: v.number(),
    importStatus: v.union(
      v.literal("idle"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    lastImportStartedAt: v.optional(v.number()),
    lastImportCompletedAt: v.optional(v.number()),
    lastImportCount: v.optional(v.number()),
    lastImportError: v.union(v.string(), v.null()),
  })
    .index("by_userId", ["userId"])
    .index("by_stravaAthleteId", ["stravaAthleteId"]),

  activities: defineTable({
    userId: v.id("users"),
    name: v.string(),
    sportType: v.string(),
    distance: v.number(),
    movingTime: v.number(),
    startDate: v.string(),
    // Optional — Strava-specific or supplementary
    stravaActivityId: v.optional(v.string()),
    type: v.optional(v.string()),
    elapsedTime: v.optional(v.number()),
    totalElevationGain: v.optional(v.number()),
    startDateLocal: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    xp: v.optional(v.number()),
    averageSpeed: v.optional(v.number()),
  })
    .index("by_userId_and_startDate", ["userId", "startDate"])
    .index("by_userId_and_stravaActivityId", ["userId", "stravaActivityId"]),
});
