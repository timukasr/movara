import * as React from "react";
import { useAuth } from "@clerk/expo";
import { useAction } from "convex/react";
import { type Href, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { env } from "@/lib/env";
import { consumeStravaOauthState, normalizeSearchParam } from "@/lib/strava-auth";

export default function StravaCallbackScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const completeAuthorization = useAction(api.strava.completeAuthorization);
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    scope?: string | string[];
    state?: string | string[];
  }>();
  const handledRef = React.useRef(false);
  const [message, setMessage] = React.useState("Finishing Strava connection...");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || handledRef.current) {
      return;
    }

    handledRef.current = true;

    const run = async () => {
      const returnedState = normalizeSearchParam(params.state);
      const expectedState = await consumeStravaOauthState();

      if (!expectedState || !returnedState || expectedState !== returnedState) {
        setErrorMessage("Strava returned an invalid state. Start the connection again.");
        return;
      }

      const error = normalizeSearchParam(params.error);
      if (error) {
        setErrorMessage(error === "access_denied" ? "Strava authorization was denied." : `Strava returned: ${error}`);
        return;
      }

      const code = normalizeSearchParam(params.code);
      if (!code) {
        setErrorMessage("Strava did not return an authorization code.");
        return;
      }

      if (!env.stravaClientId) {
        setErrorMessage("Missing EXPO_PUBLIC_STRAVA_CLIENT_ID. Add it before connecting Strava.");
        return;
      }

      try {
        const scope = normalizeSearchParam(params.scope);
        const result = await completeAuthorization(
          scope
            ? {
                code,
                scope,
                clientId: env.stravaClientId,
              }
            : {
                code,
                clientId: env.stravaClientId,
              },
        );
        setMessage(`Imported ${result.importedCount} recent activities for ${result.athleteDisplayName}.`);
        router.replace("/" as Href);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not finish the Strava import.");
      }
    };

    void run();
  }, [completeAuthorization, isLoaded, isSignedIn, params.code, params.error, params.scope, params.state, router]);

  if (isLoaded && !isSignedIn) {
    return <Redirect href={"/sign-in" as Href} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <Text style={styles.eyebrow}>movara</Text>
        <Text style={styles.title}>{errorMessage ? "Strava connect failed" : "Connecting Strava"}</Text>
        <Text style={styles.body}>{errorMessage ?? message}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace("/" as Href)}
        >
          <Text style={styles.buttonText}>{errorMessage ? "Back to home" : "Open home"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  shell: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  eyebrow: {
    color: "#fc6c47",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#f5f7fb",
    fontSize: 34,
    fontWeight: "800",
  },
  body: {
    color: "#9eb2c7",
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#fc6c47",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#fff7f3",
    fontSize: 15,
    fontWeight: "800",
  },
});
