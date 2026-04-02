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
    createdByTokenIdentifier: v.string(),
    createdAt: v.number(),
  }).index("by_createdByTokenIdentifier", ["createdByTokenIdentifier"]),

  challengeMembers: defineTable({
    challengeId: v.id("challenges"),
    memberClerkUserId: v.string(),
    memberName: v.string(),
    memberImageUrl: v.union(v.string(), v.null()),
    role: v.union(v.literal("owner"), v.literal("member")),
    currentXp: v.number(),
    addedByTokenIdentifier: v.string(),
    addedAt: v.number(),
  })
    .index("by_challengeId", ["challengeId"])
    .index("by_memberClerkUserId", ["memberClerkUserId"])
    .index("by_challengeId_and_memberClerkUserId", [
      "challengeId",
      "memberClerkUserId",
    ]),

  challengeMessages: defineTable({
    challengeId: v.id("challenges"),
    memberClerkUserId: v.string(),
    memberName: v.string(),
    text: v.string(),
  }).index("by_challengeId", ["challengeId"]),

  stravaConnections: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.optional(v.string()),
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
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_stravaAthleteId", ["stravaAthleteId"]),

  stravaActivities: defineTable({
    tokenIdentifier: v.string(),
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
    xp: v.optional(v.number()),
    averageSpeed: v.optional(v.number()),
  })
    .index("by_tokenIdentifier_and_startDate", ["tokenIdentifier", "startDate"])
    .index("by_tokenIdentifier_and_stravaActivityId", [
      "tokenIdentifier",
      "stravaActivityId",
    ]),
});
