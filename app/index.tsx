import * as React from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { type Href, Redirect, useRouter } from "expo-router";
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
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
    return <LoadingState title="Checking session" body="Waiting for Clerk to finish booting." />;
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
      setConnectError("Missing EXPO_PUBLIC_STRAVA_CLIENT_ID. Add it before connecting Strava.");
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

      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);

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
      setConnectError(error instanceof Error ? error.message : "Could not open the Strava authorization flow.");
    } finally {
      setConnectBusy(false);
    }
  };

  const handleReimport = async () => {
    if (!env.stravaClientId) {
      setConnectError("Missing EXPO_PUBLIC_STRAVA_CLIENT_ID. Add it before importing from Strava.");
      return;
    }

    setReimportBusy(true);
    setConnectError(null);

    try {
      await reimportRecent({
        clientId: env.stravaClientId,
      });
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Could not reimport Strava activities.");
    } finally {
      setReimportBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>movara</Text>
        <Text style={styles.title}>Clerk signs users in. Strava fills the feed.</Text>
        <Text style={styles.subtitle}>
          The app now links a Strava account, imports the last 90 days, and keeps the activity list inside Convex.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Clerk user</Text>
          <Text style={styles.cardValue}>{user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Signed in"}</Text>
          <Text style={styles.cardHint}>User ID: {user?.id ?? "missing"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Convex auth state</Text>
          <Text style={styles.cardValue}>
            {isLoading ? "Syncing token with Convex..." : isAuthenticated ? "Convex session ready" : "Waiting on Convex auth"}
          </Text>
          <Text style={styles.cardHint}>
            {viewer
              ? `subject=${viewer.subject} email=${viewer.email ?? "n/a"}`
              : "If this never resolves, check CLERK_JWT_ISSUER_DOMAIN and rerun `npx convex dev`."}
          </Text>
        </View>

        <View style={[styles.card, styles.stravaCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerCopy}>
              <Text style={[styles.cardLabel, styles.stravaLabel]}>Strava</Text>
              <Text style={styles.cardValue}>
                {stravaStatus ? stravaStatus.athleteDisplayName : "Connect a Strava account"}
              </Text>
            </View>
            {stravaStatus ? (
              <Text style={[styles.statusBadge, getStatusBadgeStyle(stravaStatus.importStatus)]}>
                {formatImportStatus(stravaStatus.importStatus)}
              </Text>
            ) : null}
          </View>

          <Text style={styles.cardHint}>
            {stravaStatus
              ? formatStatusHint(stravaStatus)
              : "Authorize Strava to import the last 90 days of activities into Convex."}
          </Text>

          {stravaStatus ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
                (reimportBusy || stravaStatus.importStatus === "running") && styles.buttonDisabled,
              ]}
              disabled={reimportBusy || stravaStatus.importStatus === "running"}
              onPress={handleReimport}
            >
              <Text style={styles.secondaryButtonText}>
                {reimportBusy || stravaStatus.importStatus === "running" ? "Syncing..." : "Reimport last 90 days"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                connectBusy && styles.buttonDisabled,
              ]}
              disabled={connectBusy}
              onPress={handleConnectStrava}
            >
              <Text style={styles.primaryButtonText}>{connectBusy ? "Opening Strava..." : "Connect with Strava"}</Text>
            </Pressable>
          )}

          {connectError ? <Text style={styles.errorText}>{connectError}</Text> : null}

          {stravaStatus ? (
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Recent activities</Text>
              {recentActivities === undefined ? (
                <Text style={styles.cardHint}>Loading imported activities...</Text>
              ) : recentActivities.length === 0 ? (
                <Text style={styles.cardHint}>No activities imported yet.</Text>
              ) : (
                recentActivities.map((activity) => (
                  <View key={activity.stravaActivityId} style={styles.activityRow}>
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityTitle}>{activity.name}</Text>
                      <Text style={styles.activityMeta}>
                        {activity.sportType} • {formatDistance(activity.distance)} • {formatActivityDate(activity.startDateLocal)}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>{formatDuration(activity.movingTime)}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>

        <Pressable style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]} onPress={handleSignOut}>
          <Text style={styles.ghostButtonText}>Sign out</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingWrap}>
        <Text style={styles.eyebrow}>movara</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{body}</Text>
      </View>
    </SafeAreaView>
  );
}

function formatImportStatus(status: "idle" | "running" | "succeeded" | "failed") {
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

  const lastImported = status.lastImportCompletedAt ? formatRelativeDate(status.lastImportCompletedAt) : "never";
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

function getStatusBadgeStyle(status: "idle" | "running" | "succeeded" | "failed") {
  if (status === "running") {
    return styles.statusRunning;
  }

  if (status === "failed") {
    return styles.statusFailed;
  }

  if (status === "succeeded") {
    return styles.statusSuccess;
  }

  return styles.statusIdle;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 18,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  eyebrow: {
    color: "#7ef5c5",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#f5f7fb",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    color: "#9eb2c7",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#0d1b2d",
    borderRadius: 22,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#17304a",
  },
  stravaCard: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  cardLabel: {
    color: "#7ef5c5",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  stravaLabel: {
    color: "#fc6c47",
  },
  cardValue: {
    color: "#f5f7fb",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  cardHint: {
    color: "#9eb2c7",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: "#fc6c47",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff7f3",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fc6c47",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#fc6c47",
    fontSize: 14,
    fontWeight: "800",
  },
  ghostButton: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#17304a",
    paddingVertical: 16,
    alignItems: "center",
  },
  ghostButtonText: {
    color: "#d6dfeb",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  statusIdle: {
    backgroundColor: "#15283d",
    color: "#9eb2c7",
  },
  statusRunning: {
    backgroundColor: "#473422",
    color: "#ffc48f",
  },
  statusSuccess: {
    backgroundColor: "#1a3a31",
    color: "#7ef5c5",
  },
  statusFailed: {
    backgroundColor: "#3c1f28",
    color: "#ff9eb0",
  },
  activitySection: {
    marginTop: 4,
    gap: 10,
  },
  sectionTitle: {
    color: "#f5f7fb",
    fontSize: 16,
    fontWeight: "700",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 16,
    backgroundColor: "#101f33",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  activityCopy: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    color: "#f5f7fb",
    fontSize: 15,
    fontWeight: "700",
  },
  activityMeta: {
    color: "#9eb2c7",
    fontSize: 13,
    lineHeight: 18,
  },
  activityTime: {
    color: "#fc6c47",
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    color: "#ff9eb0",
    fontSize: 14,
    lineHeight: 20,
  },
});
