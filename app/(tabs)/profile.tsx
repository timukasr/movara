import { useClerk, useUser } from "@clerk/expo";
import { useAction, useMutation, useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { useRouter, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatXp } from "@/constants/activity-xp";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/auth";
import { Card } from "@/lib/card";
import { AppHeader } from "@/lib/header";
import {
  buildStravaAuthorizationUrl,
  createStravaOauthState,
  createStravaRedirectUri,
  saveStravaOauthState,
} from "@/lib/strava-auth";
import { UserAvatar } from "@/lib/user-avatar";

export default function ProfileScreen() {
  return <SignedInHome />;
}

function SignedInHome() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { currentUser } = useCurrentUser();
  const stravaStatus = useQuery(api.strava.getStatus);
  const stravaAppConfig = useQuery(api.strava.getAppConfig);
  const reimportRecent = useAction(api.strava.reimportRecent);
  const saveAppCredentials = useMutation(api.strava.saveAppCredentials);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const [connectNotice, setConnectNotice] = React.useState<string | null>(null);
  const [connectBusy, setConnectBusy] = React.useState(false);
  const [reimportBusy, setReimportBusy] = React.useState(false);
  const [saveBusy, setSaveBusy] = React.useState(false);
  const [clientIdInput, setClientIdInput] = React.useState("");
  const [clientSecretInput, setClientSecretInput] = React.useState("");
  const [guideVisible, setGuideVisible] = React.useState(false);
  const previousSavedClientIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  React.useEffect(() => {
    const savedClientId = stravaAppConfig?.clientId ?? null;

    if (
      clientIdInput === "" ||
      clientIdInput === previousSavedClientIdRef.current
    ) {
      setClientIdInput(savedClientId ?? "");
    }

    previousSavedClientIdRef.current = savedClientId;
  }, [clientIdInput, stravaAppConfig?.clientId]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in" as Href);
  };

  const handleSaveStravaApp = async () => {
    setSaveBusy(true);
    setConnectError(null);
    setConnectNotice(null);

    try {
      const result = await saveAppCredentials({
        clientId: clientIdInput,
        clientSecret: clientSecretInput,
      });
      setClientIdInput(result.clientId);
      setClientSecretInput("");
      setConnectNotice(
        result.disconnectedExistingConnection
          ? "Saved new Strava app credentials. Reconnect Strava to finish switching apps."
          : "Saved Strava app credentials.",
      );
    } catch (error) {
      setConnectError(
        error instanceof Error
          ? error.message
          : "Could not save Strava app credentials.",
      );
    } finally {
      setSaveBusy(false);
    }
  };

  const handleConnectStrava = async () => {
    if (!stravaAppConfig?.clientId) {
      setConnectError(
        "Save your Strava client ID and secret before connecting Strava.",
      );
      setConnectNotice(null);
      return;
    }

    setConnectBusy(true);
    setConnectError(null);
    setConnectNotice(null);

    try {
      const state = createStravaOauthState();
      const redirectUri = createStravaRedirectUri();
      const authorizeUrl = buildStravaAuthorizationUrl({
        clientId: stravaAppConfig.clientId,
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
    if (!stravaAppConfig?.clientId) {
      setConnectError(
        "Save your Strava client ID and secret before importing from Strava.",
      );
      setConnectNotice(null);
      return;
    }

    setReimportBusy(true);
    setConnectError(null);
    setConnectNotice(null);

    try {
      await reimportRecent({});
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

  const displayName =
    currentUser?.name ??
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Movara User";
  const displayEmail =
    currentUser?.primaryEmail ??
    user?.primaryEmailAddress?.emailAddress ??
    null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader hideAvatar />
      <ScrollView contentContainerClassName="grow px-6 pb-24 gap-5">
        {/* Profile hero */}
        <View className="items-center gap-4 py-4">
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              shadowColor: "#ff9066",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 20,
            }}
          >
            <UserAvatar
              imageUrl={user?.imageUrl}
              name={displayName}
              email={displayEmail}
              size={120}
            />
          </View>
          <View className="items-center gap-1">
            <Text className="text-3xl font-black tracking-tight text-on-surface">
              {displayName}
            </Text>
            {displayEmail ? (
              <Text className="text-sm text-on-surface-variant">
                {displayEmail}
              </Text>
            ) : null}
          </View>
          <View className="rounded-full bg-surface-container-high px-5 py-2.5">
            <Text className="text-lg font-extrabold text-primary">
              {formatXp(currentUser?.totalXp ?? 0)} XP
            </Text>
          </View>
        </View>

        {/* Strava setup guide modal */}
        <StravaGuideModal
          visible={guideVisible}
          onClose={() => setGuideVisible(false)}
        />

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
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setGuideVisible(true)}
                  className="h-8 w-8 items-center justify-center rounded-full border border-outline-variant/30 active:opacity-70"
                >
                  <Text className="text-sm font-bold text-on-surface-variant">
                    ?
                  </Text>
                </Pressable>
                {stravaStatus ? (
                  <Text
                    className={`overflow-hidden rounded-full px-3 py-[7px] text-xs font-extrabold ${getStatusBadgeClass(stravaStatus.importStatus)}`}
                  >
                    {formatImportStatus(stravaStatus.importStatus)}
                  </Text>
                ) : null}
              </View>
            </View>

            <Text className="text-sm leading-5 text-on-surface-variant">
              {stravaStatus
                ? formatStatusHint(stravaStatus)
                : "Save your Strava app credentials, then authorize Strava to import the last 90 days of activities into Convex."}
            </Text>

            <View className="gap-3">
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-outline-variant/30 bg-background px-4 py-3 text-base text-on-surface"
                keyboardType="number-pad"
                onChangeText={setClientIdInput}
                placeholder="Strava client ID"
                placeholderTextColor="#8AA0B7"
                value={clientIdInput}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-outline-variant/30 bg-background px-4 py-3 text-base text-on-surface"
                onChangeText={setClientSecretInput}
                placeholder={
                  stravaAppConfig
                    ? "Enter a new Strava client secret to update it"
                    : "Strava client secret"
                }
                placeholderTextColor="#8AA0B7"
                secureTextEntry
                value={clientSecretInput}
              />
              <Pressable
                className={`items-center rounded-full border border-outline-variant/30 py-3 ${
                  saveBusy ? "opacity-55" : "active:opacity-[0.88]"
                }`}
                disabled={saveBusy}
                onPress={handleSaveStravaApp}
              >
                <Text className="text-sm font-extrabold text-on-surface">
                  {saveBusy
                    ? "Saving..."
                    : stravaAppConfig
                      ? "Update Strava app"
                      : "Save Strava app"}
                </Text>
              </Pressable>
              <Text className="text-xs leading-5 text-on-surface-variant">
                {stravaAppConfig
                  ? `Saved client ID ${stravaAppConfig.clientId}. Enter a secret only when you want to replace it.`
                  : "These credentials are stored in Convex for this Movara user and used for token refreshes plus webhook registration."}
              </Text>
            </View>

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
                  connectBusy || !stravaAppConfig?.clientId
                    ? "opacity-55"
                    : "active:opacity-[0.88]"
                }`}
                disabled={connectBusy || !stravaAppConfig?.clientId}
                onPress={handleConnectStrava}
              >
                <Text className="text-base font-extrabold text-on-surface">
                  {connectBusy
                    ? "Opening Strava..."
                    : stravaAppConfig?.clientId
                      ? "Connect with Strava"
                      : "Save app credentials first"}
                </Text>
              </Pressable>
            )}

            {connectError ? (
              <Text className="text-sm leading-5 text-error">
                {connectError}
              </Text>
            ) : null}
            {connectNotice ? (
              <Text className="text-sm leading-5 text-success">
                {connectNotice}
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

function StravaGuideModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-lg font-black uppercase tracking-widest text-primary">
            Strava Setup
          </Text>
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-sm font-bold text-primary">Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="gap-6 px-6 pb-24">
          <GuideStep
            number="1"
            title="Log in to Strava"
            description="Go to www.strava.com and log in to your account, or create one if you don't have one yet."
          />
          <GuideStep
            number="2"
            title="Open your API application settings"
            description={
              "Click your profile icon (top right) → Settings → My API Application.\n\nOr go directly to www.strava.com/settings/api"
            }
          />
          <GuideStep
            number="3"
            title="Create an API application"
            description={
              "If you don't have an API application yet, create one. The other fields can be anything, but these two are important:\n\n• Website → movara.fit\n• Authorization Callback Domain → movara.fit"
            }
          />
          <GuideStep
            number="4"
            title="Copy your credentials"
            description="On the API application page, copy the Client ID and Client Secret."
          />
          <GuideStep
            number="5"
            title="Enter credentials in Movara"
            description="Close this guide, paste your Client ID and Client Secret into the fields below, and tap Save."
          />
          <GuideStep
            number="6"
            title="Connect with Strava"
            description="Tap Connect with Strava and authorize the app. Movara will import your last 90 days of activities automatically."
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function GuideStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row gap-4">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Text className="text-sm font-black text-on-primary">{number}</Text>
      </View>
      <View className="flex-1 gap-1.5">
        <Text className="text-base font-bold text-on-surface">{title}</Text>
        <Text className="text-sm leading-5 text-on-surface-variant">
          {description}
        </Text>
      </View>
    </View>
  );
}
