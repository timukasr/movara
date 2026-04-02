import { useClerk, useUser } from "@clerk/expo";
import { useAction, useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { useRouter, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/auth";
import { Card } from "@/lib/card";
import { env } from "@/lib/env";
import { AppHeader } from "@/lib/header";
import {
  buildStravaAuthorizationUrl,
  createStravaOauthState,
  createStravaRedirectUri,
  saveStravaOauthState,
} from "@/lib/strava-auth";

export default function ProfileScreen() {
  return <SignedInHome />;
}

function SignedInHome() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { currentUser } = useCurrentUser();
  const stravaStatus = useQuery(api.strava.getStatus);
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
      <AppHeader />
      <ScrollView contentContainerClassName="grow px-6 pb-24 gap-5">
        <Text className="text-[34px] font-extrabold leading-10 text-on-surface">
          Clerk signs users in. Strava fills the feed.
        </Text>
        <Text className="text-base leading-6 text-on-surface-variant">
          The app now links a Strava account, imports the last 90 days, and
          keeps the activity list inside Convex.
        </Text>

        {/* Clerk user card */}
        <Card compact bg="bg-surface-container">
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-primary">
              Clerk user
            </Text>
            <Text className="text-[22px] font-bold leading-7 text-on-surface">
              {user?.fullName ??
                user?.primaryEmailAddress?.emailAddress ??
                "Signed in"}
            </Text>
            <Text className="text-sm leading-5 text-on-surface-variant">
              {user?.primaryEmailAddress?.emailAddress ?? "No email available"}
            </Text>
          </View>
        </Card>

        {/* Movara profile card */}
        <Card compact bg="bg-surface-container">
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-primary">
              Movara profile
            </Text>
            <Text className="text-[22px] font-bold leading-7 text-on-surface">
              {currentUser?.name ??
                user?.fullName ??
                user?.primaryEmailAddress?.emailAddress ??
                "Signed in"}
            </Text>
            <Text className="text-sm leading-5 text-on-surface-variant">
              {`userId=${currentUser?._id ?? "missing"} email=${currentUser?.primaryEmail ?? "n/a"}`}
            </Text>
          </View>
        </Card>

        {/* Strava card */}
        <Card compact bg="bg-surface-container">
          <View className="gap-3.5">
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
                disabled={
                  reimportBusy || stravaStatus.importStatus === "running"
                }
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
              <Text className="text-sm leading-5 text-error">
                {connectError}
              </Text>
            ) : null}
          </View>
        </Card>

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
