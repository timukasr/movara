import { v } from "convex/values";

import { internal } from "./_generated/api";
import { type Doc } from "./_generated/dataModel";
import {
  action,
  internalAction,
  query,
  type ActionCtx,
} from "./_generated/server";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_SUBSCRIPTIONS_URL = `${STRAVA_API_BASE}/push_subscriptions`;
const REQUIRED_SCOPES = ["activity:read_all", "profile:read_all"];
const IMPORT_WINDOW_SECONDS = 90 * 24 * 60 * 60;
const PAGE_SIZE = 200;
const TOKEN_REFRESH_BUFFER_SECONDS = 60 * 60;

type StravaConnection = Doc<"stravaConnections">;
type ConnectionState = Pick<
  StravaConnection,
  | "clerkUserId"
  | "stravaAthleteId"
  | "athleteDisplayName"
  | "athleteUsername"
  | "athleteProfile"
  | "grantedScopes"
  | "accessToken"
  | "refreshToken"
  | "accessTokenExpiresAt"
  | "importStatus"
  | "lastImportError"
>;

type TokenExchangeResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type AthleteResponse = {
  id: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  profile?: string;
  profile_medium?: string;
};

type ActivityResponse = {
  id: number;
  name?: string;
  sport_type?: string;
  type?: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  start_date?: string;
  start_date_local?: string;
  timezone?: string;
  private?: boolean;
  average_speed?: number;
};

type StravaWebhookEvent = {
  aspectType: "create" | "update" | "delete";
  eventTime?: number;
  objectId: number;
  objectType: "activity" | "athlete";
  ownerId: number;
  subscriptionId?: number;
  updates?: Record<string, string>;
};

type StravaWebhookSubscription = {
  id: number;
  callback_url?: string;
  created_at?: string;
  updated_at?: string;
};

const webhookUpdatesValidator = v.optional(v.record(v.string(), v.string()));

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!connection) {
      return null;
    }

    return {
      athleteDisplayName: connection.athleteDisplayName,
      athleteUsername: connection.athleteUsername ?? null,
      athleteProfile: connection.athleteProfile ?? null,
      grantedScopes: connection.grantedScopes,
      importStatus: connection.importStatus,
      lastImportStartedAt: connection.lastImportStartedAt ?? null,
      lastImportCompletedAt: connection.lastImportCompletedAt ?? null,
      lastImportCount: connection.lastImportCount ?? null,
      lastImportError: connection.lastImportError,
    };
  },
});

export const listRecentActivities = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const activities = await ctx.db
      .query("stravaActivities")
      .withIndex("by_tokenIdentifier_and_startDate", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .take(20);

    return activities.map((activity) => ({
      id: activity._id,
      stravaActivityId: activity.stravaActivityId,
      name: activity.name,
      sportType: activity.sportType,
      type: activity.type,
      distance: activity.distance,
      movingTime: activity.movingTime,
      elapsedTime: activity.elapsedTime,
      totalElevationGain: activity.totalElevationGain,
      startDate: activity.startDate,
      startDateLocal: activity.startDateLocal,
      timezone: activity.timezone,
      isPrivate: activity.isPrivate,
      xp: activity.xp ?? null,
      averageSpeed: activity.averageSpeed ?? null,
    }));
  },
});

export const completeAuthorization = action({
  args: {
    code: v.string(),
    scope: v.optional(v.string()),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const grantedScopes = parseGrantedScopes(args.scope);
    assertRequiredScopes(grantedScopes);

    const existingConnection: StravaConnection | null = await ctx.runQuery(
      internal.stravaModel.getConnectionForToken,
      {
        tokenIdentifier: identity.tokenIdentifier,
      },
    );

    const clientSecret = getStravaClientSecret();
    const exchangedTokens = await exchangeAuthorizationCode({
      clientId: args.clientId,
      clientSecret,
      code: args.code,
    });
    const athlete = await fetchAthlete(exchangedTokens.access_token);
    const connectionState = createConnectionState({
      clerkUserId: getClerkUserId(identity),
      stravaAthleteId: String(athlete.id),
      athleteDisplayName: formatAthleteDisplayName(athlete),
      athleteUsername: athlete.username,
      athleteProfile: athlete.profile_medium ?? athlete.profile,
      grantedScopes,
      accessToken: exchangedTokens.access_token,
      refreshToken: exchangedTokens.refresh_token,
      accessTokenExpiresAt: exchangedTokens.expires_at,
      importStatus: "running",
      lastImportError: null,
    });

    await ctx.runMutation(internal.stravaModel.upsertConnection, {
      tokenIdentifier: identity.tokenIdentifier,
      connection: {
        ...connectionState,
      },
    });
    await ctx.runMutation(internal.stravaModel.setImportRunning, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (
      existingConnection &&
      existingConnection.stravaAthleteId !== String(athlete.id)
    ) {
      await clearActivitiesForToken(ctx, identity.tokenIdentifier);
      await ctx.runMutation(internal.challenges.recomputeMemberXpForClerkUser, {
        clerkUserId: getClerkUserId(identity),
      });
    }

    try {
      const importedCount = await importRecentActivities(ctx, {
        tokenIdentifier: identity.tokenIdentifier,
        clientId: args.clientId,
        connection: connectionState,
      });

      await ctx.runMutation(internal.stravaModel.recordImportSuccess, {
        tokenIdentifier: identity.tokenIdentifier,
        importedCount,
      });

      return {
        athleteDisplayName: formatAthleteDisplayName(athlete),
        importedCount,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      await ctx.runMutation(internal.stravaModel.recordImportFailure, {
        tokenIdentifier: identity.tokenIdentifier,
        message,
      });
      throw new Error(message);
    }
  },
});

export const reimportRecent = action({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const connection: StravaConnection | null = await ctx.runQuery(
      internal.stravaModel.getConnectionForToken,
      {
        tokenIdentifier: identity.tokenIdentifier,
      },
    );

    if (!connection) {
      throw new Error("Connect Strava before importing activities.");
    }

    await ctx.runMutation(internal.stravaModel.upsertConnection, {
      tokenIdentifier: identity.tokenIdentifier,
      connection: createConnectionState({
        ...connection,
        clerkUserId: getClerkUserId(identity),
      }),
    });

    await ctx.runMutation(internal.stravaModel.setImportRunning, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    try {
      const importedCount = await importRecentActivities(ctx, {
        tokenIdentifier: identity.tokenIdentifier,
        clientId: args.clientId,
        connection: {
          ...connection,
          clerkUserId: getClerkUserId(identity),
          importStatus: "running",
          lastImportError: null,
        },
      });

      await ctx.runMutation(internal.stravaModel.recordImportSuccess, {
        tokenIdentifier: identity.tokenIdentifier,
        importedCount,
      });

      return { importedCount };
    } catch (error) {
      const message = getErrorMessage(error);
      await ctx.runMutation(internal.stravaModel.recordImportFailure, {
        tokenIdentifier: identity.tokenIdentifier,
        message,
      });
      throw new Error(message);
    }
  },
});

export const processWebhookEvent = internalAction({
  args: {
    aspectType: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
    ),
    eventTime: v.optional(v.number()),
    objectId: v.number(),
    objectType: v.union(v.literal("activity"), v.literal("athlete")),
    ownerId: v.number(),
    subscriptionId: v.optional(v.number()),
    updates: webhookUpdatesValidator,
  },
  handler: async (ctx, args) => {
    const connection: StravaConnection | null = await ctx.runQuery(
      internal.stravaModel.getConnectionForAthleteId,
      {
        stravaAthleteId: String(args.ownerId),
      },
    );

    if (!connection) {
      return null;
    }

    if (args.objectType === "athlete") {
      const isDeauthorized =
        args.aspectType === "delete" || args.updates?.authorized === "false";

      if (!isDeauthorized) {
        return null;
      }

      await clearActivitiesForToken(ctx, connection.tokenIdentifier);
      if (connection.clerkUserId) {
        await ctx.runMutation(
          internal.challenges.recomputeMemberXpForClerkUser,
          {
            clerkUserId: connection.clerkUserId,
          },
        );
      }
      await ctx.runMutation(internal.stravaModel.deleteConnectionForToken, {
        tokenIdentifier: connection.tokenIdentifier,
      });
      return null;
    }

    if (args.aspectType === "delete") {
      await ctx.runMutation(internal.stravaModel.deleteActivityByStravaId, {
        tokenIdentifier: connection.tokenIdentifier,
        stravaActivityId: String(args.objectId),
      });
      return null;
    }

    const freshConnection = await ensureFreshAccessToken(ctx, {
      tokenIdentifier: connection.tokenIdentifier,
      clientId: getStravaClientId(),
      connection,
    });
    const activity = await fetchActivityById(
      freshConnection.accessToken,
      args.objectId,
    );

    if (!activity) {
      await ctx.runMutation(internal.stravaModel.deleteActivityByStravaId, {
        tokenIdentifier: connection.tokenIdentifier,
        stravaActivityId: String(args.objectId),
      });
      return null;
    }

    await ctx.runMutation(internal.stravaModel.upsertActivitiesPage, {
      tokenIdentifier: connection.tokenIdentifier,
      activities: [mapActivity(activity)],
    });
    return null;
  },
});

export const listWebhookSubscriptions = internalAction({
  args: {},
  handler: async () => {
    return await listStravaWebhookSubscriptions({
      clientId: getStravaClientId(),
      clientSecret: getStravaClientSecret(),
    });
  },
});

export const deleteWebhookSubscription = internalAction({
  args: {
    subscriptionId: v.number(),
  },
  handler: async (_ctx, args) => {
    await deleteStravaWebhookSubscription({
      clientId: getStravaClientId(),
      clientSecret: getStravaClientSecret(),
      subscriptionId: args.subscriptionId,
    });

    return null;
  },
});

export const registerWebhookSubscription = internalAction({
  args: {},
  handler: async () => {
    const clientId = getStravaClientId();
    const clientSecret = getStravaClientSecret();
    const callbackUrl = getStravaWebhookCallbackUrl();
    const verifyToken = getStravaWebhookVerifyToken();
    const existingSubscriptions = await listStravaWebhookSubscriptions({
      clientId,
      clientSecret,
    });

    const deletedSubscriptionIds: number[] = [];
    for (const subscription of existingSubscriptions) {
      await deleteStravaWebhookSubscription({
        clientId,
        clientSecret,
        subscriptionId: subscription.id,
      });
      deletedSubscriptionIds.push(subscription.id);
    }

    const subscription = await createStravaWebhookSubscription({
      clientId,
      clientSecret,
      callbackUrl,
      verifyToken,
    });

    return {
      callbackUrl,
      deletedSubscriptionIds,
      subscription,
    };
  },
});

async function requireIdentity(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("You must be signed in to connect Strava.");
  }

  return identity;
}

function parseGrantedScopes(scope: string | undefined) {
  return (scope ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function assertRequiredScopes(grantedScopes: string[]) {
  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  if (missingScopes.length > 0) {
    throw new Error(
      `Strava authorization is missing required scopes: ${missingScopes.join(", ")}.`,
    );
  }
}

function getStravaClientSecret() {
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error("Missing STRAVA_CLIENT_SECRET in Convex env.");
  }

  return clientSecret;
}

function getStravaClientId() {
  const clientId = process.env.STRAVA_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing STRAVA_CLIENT_ID in Convex env.");
  }

  return clientId;
}

function getStravaWebhookVerifyToken() {
  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    throw new Error("Missing STRAVA_WEBHOOK_VERIFY_TOKEN in Convex env.");
  }

  return verifyToken;
}

function getStravaWebhookCallbackUrl() {
  const siteUrl =
    process.env.CONVEX_SITE_URL ??
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
    deriveConvexSiteUrl(
      process.env.CONVEX_CLOUD_URL ?? process.env.EXPO_PUBLIC_CONVEX_URL,
    );

  if (!siteUrl) {
    throw new Error(
      "Missing CONVEX_SITE_URL and no Convex cloud URL was available to derive the Strava webhook callback URL.",
    );
  }

  return new URL("/strava/webhook", ensureTrailingSlash(siteUrl)).toString();
}

async function exchangeAuthorizationCode(args: {
  clientId: string;
  clientSecret: string;
  code: string;
}) {
  return await postTokenExchange({
    clientId: args.clientId,
    clientSecret: args.clientSecret,
    grantType: "authorization_code",
    code: args.code,
  });
}

async function refreshAccessToken(args: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  return await postTokenExchange({
    clientId: args.clientId,
    clientSecret: args.clientSecret,
    grantType: "refresh_token",
    refreshToken: args.refreshToken,
  });
}

async function postTokenExchange(args: {
  clientId: string;
  clientSecret: string;
  grantType: "authorization_code" | "refresh_token";
  code?: string;
  refreshToken?: string;
}) {
  const body = new URLSearchParams({
    client_id: args.clientId,
    client_secret: args.clientSecret,
    grant_type: args.grantType,
  });

  if (args.code) {
    body.set("code", args.code);
  }

  if (args.refreshToken) {
    body.set("refresh_token", args.refreshToken);
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return (await parseStravaResponse(response)) as TokenExchangeResponse;
}

async function fetchAthlete(accessToken: string) {
  const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return (await parseStravaResponse(response)) as AthleteResponse;
}

async function listStravaWebhookSubscriptions(args: {
  clientId: string;
  clientSecret: string;
}) {
  const url = new URL(STRAVA_SUBSCRIPTIONS_URL);
  url.searchParams.set("client_id", args.clientId);
  url.searchParams.set("client_secret", args.clientSecret);

  const response = await fetch(url);
  const body = await parseStravaResponse(response);

  if (!Array.isArray(body)) {
    throw new Error(
      "Strava returned an unexpected webhook subscriptions payload.",
    );
  }

  return body.filter(isWebhookSubscription);
}

async function createStravaWebhookSubscription(args: {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  verifyToken: string;
}) {
  const body = new URLSearchParams({
    client_id: args.clientId,
    client_secret: args.clientSecret,
    callback_url: args.callbackUrl,
    verify_token: args.verifyToken,
  });

  const response = await fetch(STRAVA_SUBSCRIPTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const created = await parseStravaResponse(response);

  if (!isWebhookSubscription(created)) {
    throw new Error(
      "Strava returned an unexpected webhook subscription response.",
    );
  }

  return created;
}

async function deleteStravaWebhookSubscription(args: {
  clientId: string;
  clientSecret: string;
  subscriptionId: number;
}) {
  const url = new URL(`${STRAVA_SUBSCRIPTIONS_URL}/${args.subscriptionId}`);
  url.searchParams.set("client_id", args.clientId);
  url.searchParams.set("client_secret", args.clientSecret);

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (response.status === 204) {
    return;
  }

  await parseStravaResponse(response);
}

async function fetchActivityById(accessToken: string, activityId: number) {
  const response = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  return (await parseStravaResponse(response)) as ActivityResponse;
}

async function importRecentActivities(
  ctx: ActionCtx,
  args: {
    tokenIdentifier: string;
    clientId: string;
    connection: ConnectionState;
  },
) {
  const connection = await ensureFreshAccessToken(ctx, {
    tokenIdentifier: args.tokenIdentifier,
    clientId: args.clientId,
    connection: args.connection,
  });

  const after = Math.floor(Date.now() / 1000) - IMPORT_WINDOW_SECONDS;
  let page = 1;
  let importedCount = 0;

  while (true) {
    const search = new URLSearchParams({
      after: String(after),
      page: String(page),
      per_page: String(PAGE_SIZE),
    });
    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?${search.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
      },
    );
    const activities = (await parseStravaResponse(
      response,
    )) as ActivityResponse[];

    if (activities.length === 0) {
      break;
    }

    importedCount += await ctx.runMutation(
      internal.stravaModel.upsertActivitiesPage,
      {
        tokenIdentifier: args.tokenIdentifier,
        activities: activities.map((activity) => ({
          ...mapActivity(activity),
        })),
      },
    );

    if (activities.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return importedCount;
}

async function ensureFreshAccessToken(
  ctx: ActionCtx,
  args: {
    tokenIdentifier: string;
    clientId: string;
    connection: ConnectionState;
  },
) {
  const expiresSoon =
    args.connection.accessTokenExpiresAt - Math.floor(Date.now() / 1000) <=
    TOKEN_REFRESH_BUFFER_SECONDS;

  if (!expiresSoon) {
    return args.connection;
  }

  const refreshed = await refreshAccessToken({
    clientId: args.clientId,
    clientSecret: getStravaClientSecret(),
    refreshToken: args.connection.refreshToken,
  });

  await ctx.runMutation(internal.stravaModel.upsertConnection, {
    tokenIdentifier: args.tokenIdentifier,
    connection: createConnectionState({
      stravaAthleteId: args.connection.stravaAthleteId,
      athleteDisplayName: args.connection.athleteDisplayName,
      athleteUsername: args.connection.athleteUsername,
      athleteProfile: args.connection.athleteProfile,
      grantedScopes: args.connection.grantedScopes,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      accessTokenExpiresAt: refreshed.expires_at,
      importStatus: args.connection.importStatus,
      lastImportError: args.connection.lastImportError,
    }),
  });

  return {
    ...args.connection,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    accessTokenExpiresAt: refreshed.expires_at,
  };
}

async function clearActivitiesForToken(
  ctx: ActionCtx,
  tokenIdentifier: string,
) {
  while (true) {
    const deleted = await ctx.runMutation(
      internal.stravaModel.clearActivitiesPage,
      {
        tokenIdentifier,
        limit: PAGE_SIZE,
      },
    );

    if (deleted === 0) {
      return;
    }
  }
}

function formatAthleteDisplayName(athlete: AthleteResponse) {
  const fullName = [athlete.firstname, athlete.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || athlete.username || `Athlete ${athlete.id}`;
}

function createConnectionState(connection: ConnectionState) {
  return {
    ...(connection.clerkUserId ? { clerkUserId: connection.clerkUserId } : {}),
    stravaAthleteId: connection.stravaAthleteId,
    athleteDisplayName: connection.athleteDisplayName,
    ...(connection.athleteUsername
      ? { athleteUsername: connection.athleteUsername }
      : {}),
    ...(connection.athleteProfile
      ? { athleteProfile: connection.athleteProfile }
      : {}),
    grantedScopes: connection.grantedScopes,
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    accessTokenExpiresAt: connection.accessTokenExpiresAt,
    importStatus: connection.importStatus,
    lastImportError: connection.lastImportError,
  } satisfies ConnectionState;
}

function getClerkUserId(identity: { subject?: string | null }) {
  if (!identity.subject) {
    throw new Error("Missing Clerk user ID in auth token.");
  }

  return identity.subject;
}

function mapActivity(activity: ActivityResponse) {
  return {
    stravaActivityId: String(activity.id),
    name: activity.name ?? "Untitled activity",
    sportType: activity.sport_type ?? "Workout",
    type: activity.type ?? activity.sport_type ?? "Workout",
    distance: activity.distance ?? 0,
    movingTime: activity.moving_time ?? 0,
    elapsedTime: activity.elapsed_time ?? 0,
    totalElevationGain: activity.total_elevation_gain ?? 0,
    startDate: activity.start_date ?? new Date(0).toISOString(),
    startDateLocal: activity.start_date_local ?? new Date(0).toISOString(),
    timezone: activity.timezone ?? "UTC",
    isPrivate: activity.private ?? false,
    ...(activity.average_speed !== undefined
      ? { averageSpeed: activity.average_speed }
      : {}),
  };
}

async function parseStravaResponse(response: Response) {
  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (response.ok) {
    return body;
  }

  if (response.status === 429) {
    throw new Error(
      "Strava rate limit reached. Wait a bit and retry the import.",
    );
  }

  const apiError = extractStravaError(body);
  throw new Error(
    apiError ?? `Strava request failed with status ${response.status}.`,
  );
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function deriveConvexSiteUrl(convexUrl: string | undefined) {
  if (!convexUrl) {
    return null;
  }

  const parsed = new URL(convexUrl);
  if (parsed.hostname.endsWith(".convex.cloud")) {
    parsed.hostname = `${parsed.hostname.slice(0, -".convex.cloud".length)}.convex.site`;
  }
  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function isWebhookSubscription(
  value: unknown,
): value is StravaWebhookSubscription {
  return Boolean(
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number",
  );
}

function extractStravaError(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const message =
    "message" in body && typeof body.message === "string" ? body.message : null;
  if (message) {
    return message;
  }

  const errors =
    "errors" in body && Array.isArray(body.errors)
      ? body.errors
          .map((entry) =>
            entry &&
            typeof entry === "object" &&
            "message" in entry &&
            typeof entry.message === "string"
              ? entry.message
              : null,
          )
          .filter((entry): entry is string => entry !== null)
      : [];

  if (errors.length > 0) {
    return errors.join(", ");
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Strava import failed.";
}
