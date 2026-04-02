import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/strava/webhook",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const callbackToken = getWebhookVerifyToken();
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = url.searchParams.get("hub.verify_token");

    if (mode !== "subscribe" || !challenge) {
      return json(
        { error: "Invalid Strava webhook verification request." },
        400,
      );
    }

    if (verifyToken !== callbackToken) {
      return json({ error: "Invalid Strava webhook verify token." }, 401);
    }

    return json({ "hub.challenge": challenge });
  }),
});

http.route({
  path: "/strava/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const event = parseWebhookEvent(payload);
    if (!event) {
      return json({ error: "Invalid Strava webhook payload." }, 400);
    }

    // Acknowledge immediately and move the actual sync work off the request path.
    await ctx.scheduler.runAfter(0, internal.strava.processWebhookEvent, event);
    return json({ received: true });
  }),
});

export default http;

function getWebhookVerifyToken() {
  const token = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (!token) {
    throw new Error("Missing STRAVA_WEBHOOK_VERIFY_TOKEN in Convex env.");
  }

  return token;
}

function parseWebhookEvent(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const objectType = readString(value, "object_type");
  const aspectType = readString(value, "aspect_type");
  const objectId = readNumber(value, "object_id");
  const ownerId = readNumber(value, "owner_id");
  const eventTime = readOptionalNumber(value, "event_time");
  const subscriptionId = readOptionalNumber(value, "subscription_id");
  const updates = readUpdates(value);

  if (
    !isObjectType(objectType) ||
    !isAspectType(aspectType) ||
    objectId === null ||
    ownerId === null
  ) {
    return null;
  }

  return {
    aspectType,
    eventTime: eventTime ?? undefined,
    objectId,
    objectType,
    ownerId,
    subscriptionId: subscriptionId ?? undefined,
    updates: updates ?? undefined,
  };
}

function readString(value: object, key: string) {
  if (!(key in value)) {
    return null;
  }

  const result = Reflect.get(value, key);
  return typeof result === "string" ? result : null;
}

function readNumber(value: object, key: string) {
  if (!(key in value)) {
    return null;
  }

  const result = Reflect.get(value, key);
  return typeof result === "number" ? result : null;
}

function readOptionalNumber(value: object, key: string) {
  if (!(key in value)) {
    return null;
  }

  const result = Reflect.get(value, key);
  return typeof result === "number" ? result : null;
}

function readUpdates(value: object) {
  if (!("updates" in value)) {
    return null;
  }

  const updates = Reflect.get(value, "updates");
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return null;
  }

  const entries = Object.entries(updates).filter(
    ([, entry]) => typeof entry === "string",
  );
  return Object.fromEntries(entries);
}

function isObjectType(value: string | null): value is "activity" | "athlete" {
  return value === "activity" || value === "athlete";
}

function isAspectType(
  value: string | null,
): value is "create" | "update" | "delete" {
  return value === "create" || value === "update" || value === "delete";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
