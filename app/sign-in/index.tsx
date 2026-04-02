import * as React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useSSO } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function SignInScreen() {
  useWarmUpBrowser();

  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!isLoaded) {
    return <AuthShell title="Loading auth" body="Waiting for Clerk to initialize." />;
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "movara",
          path: "/continue",
        }),
      });

      if (createdSessionId) {
        await setActive?.({
          session: createdSessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              router.replace("/continue");
              return;
            }

            const url = decorateUrl("/");
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.replace(url as Href);
            }
          },
        });
        return;
      }

      router.replace("/continue");
    } catch (error) {
      console.error("Google OAuth failed", error);
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Ship the demo"
      body="Use Google to get into the app. Web uses Clerk UI, native uses a browser redirect and comes back through movara://continue."
    >
      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}
        disabled={submitting}
        onPress={handleGoogleSignIn}
      >
        <Text style={styles.primaryButtonText}>{submitting ? "Opening Google..." : "Continue with Google"}</Text>
      </Pressable>

      <View style={styles.noteCard}>
        <Text style={styles.noteLabel}>Local setup</Text>
        <Text style={styles.noteText}>If the redirect bounces forever, add `movara://continue` and your localhost URL in Clerk.</Text>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </AuthShell>
  );
}

function AuthShell({
  title,
  body,
  children,
}: React.PropsWithChildren<{ title: string; body: string }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <Text style={styles.eyebrow}>movara</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {children}
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
    gap: 18,
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
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
  },
  body: {
    color: "#9eb2c7",
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#7ef5c5",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#05111d",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  noteCard: {
    borderRadius: 20,
    backgroundColor: "#0d1b2d",
    borderWidth: 1,
    borderColor: "#17304a",
    padding: 16,
    gap: 6,
  },
  noteLabel: {
    color: "#7ef5c5",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  noteText: {
    color: "#d6dfeb",
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    color: "#ff8e8e",
    fontSize: 14,
    lineHeight: 20,
  },
});
