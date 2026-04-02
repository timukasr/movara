import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  stravaConnections: defineTable({
    tokenIdentifier: v.string(),
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
    averageSpeed: v.optional(v.number()),
  })
    .index("by_tokenIdentifier_and_startDate", ["tokenIdentifier", "startDate"])
    .index("by_tokenIdentifier_and_stravaActivityId", ["tokenIdentifier", "stravaActivityId"]),
});
