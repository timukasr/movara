import { useAuth, useClerk, useUser } from "@clerk/expo";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { Redirect, useRouter, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { env } from "@/lib/env";
import {
  buildStravaAuthorizationUrl,
  createStravaOauthState,
  createStravaRedirectUri,
  saveStravaOauthState,
} from "@/lib/strava-auth";

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <LoadingState
        title="Checking session"
        body="Waiting for Clerk to finish booting."
      />
    );
  }

  if (!isSignedIn) {
    return <Redirect href={"/sign-in" as Href} />;
  }

  return <SignedInHome />;
}

function SignedInHome() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.viewer.current);
  const stravaStatus = useQuery(api.strava.getStatus);
  const recentActivities = useQuery(api.strava.listRecentActivities);
  const reimportRecent = useAction(api.strava.reimportRecent);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const [connectBusy, setConnectBusy] = React.useState(false);
  const [reimportBusy, setReimportBusy] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in" as Href);
  };

  const handleConnectStrava = async () => {
    if (!env.stravaClientId) {
      setConnectError(
        "Missing EXPO_PUBLIC_STRAVA_CLIENT_ID. Add it before connecting Strava.",
      );
      return;
    }

    setConnectBusy(true);
    setConnectError(null);

    try {
      const state = createStravaOauthState();
      const redirectUri = createStravaRedirectUri();
      const authorizeUrl = buildStravaAuthorizationUrl({
        clientId: env.stravaClientId,
        redirectUri,
        state,
      });

      await saveStravaOauthState(state);

      if (Platform.OS === "web") {
        window.location.assign(authorizeUrl);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authorizeUrl,
        redirectUri,
      );

      if (result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);
        const query = new URLSearchParams();

        for (const [key, value] of Object.entries(parsed.queryParams ?? {})) {
          if (typeof value === "string") {
            query.set(key, value);
          }
        }

        const queryString = query.toString();
        const href = `/strava/callback${queryString ? `?${queryString}` : ""}`;
        router.replace(href as Href);
        return;
      }

      if (result.type === "cancel") {
        setConnectError("Strava authorization was cancelled.");
        return;
      }

      setConnectError("Strava did not complete the authorization flow.");
    } catch (error) {
      setConnectError(
        error instanceof Error
          ? error.message
          : "Could not open the Strava authorization flow.",
      );
    } finally {
      setConnectBusy(false);
    }
  };

  const handleReimport = async () => {
    if (!env.stravaClientId) {
      setConnectError(
        "Missing EXPO_PUBLIC_STRAVA_CLIENT_ID. Add it before importing from Strava.",
      );
      return;
    }

    setReimportBusy(true);
    setConnectError(null);

    try {
      await reimportRecent({
        clientId: env.stravaClientId,
      });
    } catch (error) {
      setConnectError(
        error instanceof Error
          ? error.message
          : "Could not reimport Strava activities.",
      );
    } finally {
      setReimportBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow px-6 py-8 gap-5">
        <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
          movara
        </Text>
        <Text className="text-[34px] font-extrabold leading-10 text-on-surface">
          Clerk signs users in. Strava fills the feed.
        </Text>
        <Text className="text-base leading-6 text-on-surface-variant">
          The app now links a Strava account, imports the last 90 days, and
          keeps the activity list inside Convex.
        </Text>

        {/* Clerk user card */}
        <View className="gap-2 rounded-[22px] border border-outline-variant/30 bg-surface-container p-[18px]">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            Clerk user
          </Text>
          <Text className="text-[22px] font-bold leading-7 text-on-surface">
            {user?.fullName ??
              user?.primaryEmailAddress?.emailAddress ??
              "Signed in"}
          </Text>
          <Text className="text-sm leading-5 text-on-surface-variant">
            User ID: {user?.id ?? "missing"}
          </Text>
        </View>

        {/* Convex auth state card */}
        <View className="gap-2 rounded-[22px] border border-outline-variant/30 bg-surface-container p-[18px]">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            Convex auth state
          </Text>
          <Text className="text-[22px] font-bold leading-7 text-on-surface">
            {isLoading
              ? "Syncing token with Convex..."
              : isAuthenticated
                ? "Convex session ready"
                : "Waiting on Convex auth"}
          </Text>
          <Text className="text-sm leading-5 text-on-surface-variant">
            {viewer
              ? `subject=${viewer.subject} email=${viewer.email ?? "n/a"}`
              : "If this never resolves, check CLERK_JWT_ISSUER_DOMAIN and rerun `npx convex dev`."}
          </Text>
        </View>

        {/* Strava card */}
        <View className="gap-3.5 rounded-[22px] border border-outline-variant/30 bg-surface-container p-[18px]">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-xs font-bold uppercase tracking-widest text-strava">
                Strava
              </Text>
              <Text className="text-[22px] font-bold leading-7 text-on-surface">
                {stravaStatus
                  ? stravaStatus.athleteDisplayName
                  : "Connect a Strava account"}
              </Text>
            </View>
            {stravaStatus ? (
              <Text
                className={`overflow-hidden rounded-full px-3 py-[7px] text-xs font-extrabold ${getStatusBadgeClass(stravaStatus.importStatus)}`}
              >
                {formatImportStatus(stravaStatus.importStatus)}
              </Text>
            ) : null}
          </View>

          <Text className="text-sm leading-5 text-on-surface-variant">
            {stravaStatus
              ? formatStatusHint(stravaStatus)
              : "Authorize Strava to import the last 90 days of activities into Convex."}
          </Text>

          {stravaStatus ? (
            <Pressable
              className={`self-start rounded-full border border-strava px-[18px] py-3 ${
                reimportBusy || stravaStatus.importStatus === "running"
                  ? "opacity-55"
                  : "active:opacity-[0.88]"
              }`}
              disabled={reimportBusy || stravaStatus.importStatus === "running"}
              onPress={handleReimport}
            >
              <Text className="text-sm font-extrabold text-strava">
                {reimportBusy || stravaStatus.importStatus === "running"
                  ? "Syncing..."
                  : "Reimport last 90 days"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className={`mt-1 items-center rounded-full bg-strava py-4 ${
                connectBusy ? "opacity-55" : "active:opacity-[0.88]"
              }`}
              disabled={connectBusy}
              onPress={handleConnectStrava}
            >
              <Text className="text-base font-extrabold text-on-surface">
                {connectBusy ? "Opening Strava..." : "Connect with Strava"}
              </Text>
            </Pressable>
          )}

          {connectError ? (
            <Text className="text-sm leading-5 text-error">{connectError}</Text>
          ) : null}

          {stravaStatus ? (
            <View className="mt-1 gap-2.5">
              <Text className="text-base font-bold text-on-surface">
                Recent activities
              </Text>
              {recentActivities === undefined ? (
                <Text className="text-sm leading-5 text-on-surface-variant">
                  Loading imported activities...
                </Text>
              ) : recentActivities.length === 0 ? (
                <Text className="text-sm leading-5 text-on-surface-variant">
                  No activities imported yet.
                </Text>
              ) : (
                recentActivities.map((activity) => (
                  <View
                    key={activity.stravaActivityId}
                    className="flex-row items-center justify-between gap-4 rounded-2xl bg-surface-container-high px-3.5 py-3"
                  >
                    <View className="flex-1 gap-1">
                      <Text className="text-[15px] font-bold text-on-surface">
                        {activity.name}
                      </Text>
                      <Text className="text-[13px] leading-[18px] text-on-surface-variant">
                        {activity.sportType} •{" "}
                        {formatDistance(activity.distance)} •{" "}
                        {formatActivityDate(activity.startDateLocal)}
                      </Text>
                    </View>
                    <Text className="text-[13px] font-extrabold text-strava">
                      {formatDuration(activity.movingTime)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>

        {/* Sign out */}
        <Pressable
          className="mt-2 items-center rounded-full border border-outline-variant/30 py-4 active:opacity-[0.88]"
          onPress={handleSignOut}
        >
          <Text className="text-base font-extrabold text-on-surface">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type StravaStatus = {
  athleteDisplayName: string;
  athleteUsername: string | null;
  athleteProfile: string | null;
  grantedScopes: string[];
  importStatus: "idle" | "running" | "succeeded" | "failed";
  lastImportStartedAt: number | null;
  lastImportCompletedAt: number | null;
  lastImportCount: number | null;
  lastImportError: string | null;
};

function LoadingState({ title, body }: { title: string; body: string }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-3.5 px-6">
        <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
          movara
        </Text>
        <Text className="text-[34px] font-extrabold leading-10 text-on-surface">
          {title}
        </Text>
        <Text className="text-base leading-6 text-on-surface-variant">
          {body}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function formatImportStatus(
  status: "idle" | "running" | "succeeded" | "failed",
) {
  if (status === "idle") {
    return "Idle";
  }

  if (status === "running") {
    return "Importing";
  }

  if (status === "succeeded") {
    return "Ready";
  }

  return "Failed";
}

function formatStatusHint(status: StravaStatus) {
  if (status.importStatus === "running") {
    return "Strava is syncing the last 90 days of activities.";
  }

  if (status.importStatus === "failed") {
    return status.lastImportError ?? "The last Strava import failed.";
  }

  const lastImported = status.lastImportCompletedAt
    ? formatRelativeDate(status.lastImportCompletedAt)
    : "never";
  const username = status.athleteUsername ? ` @${status.athleteUsername}` : "";
  const count = status.lastImportCount ?? 0;
  return `${status.athleteDisplayName}${username}. Last import ${lastImported}. Imported ${count} activities.`;
}

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatActivityDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusBadgeClass(
  status: "idle" | "running" | "succeeded" | "failed",
) {
  if (status === "running") {
    return "bg-[#3D2A15] text-tertiary-dim";
  }

  if (status === "failed") {
    return "bg-error-container text-on-error-container";
  }

  if (status === "succeeded") {
    return "bg-[#1A2E25] text-success";
  }

  return "bg-surface-container-high text-on-surface-variant";
}
