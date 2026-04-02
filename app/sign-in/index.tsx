import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useSSO } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { Platform, Pressable, SafeAreaView, Text, View } from "react-native";

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
        redirectUrl: "movara://continue",
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
        className={`mt-3 items-center rounded-full bg-primary px-6 py-4 ${submitting ? "opacity-60" : "active:opacity-80"}`}
        disabled={submitting}
        onPress={handleGoogleSignIn}
      >
        <Text className="text-base font-extrabold text-bg">
          {submitting ? "Opening Google..." : "Continue with Google"}
        </Text>
      </Pressable>

      <View className="rounded-2xl border border-bg-card-border bg-bg-card p-4 gap-1.5">
        <Text className="text-xs font-bold uppercase tracking-widest text-primary">
          Local setup
        </Text>
        <Text className="text-sm leading-5 text-text">
          If the redirect bounces forever, add `movara://continue` and your localhost URL in Clerk.
        </Text>
      </View>

      {errorMessage ? (
        <Text className="text-sm leading-5 text-error">{errorMessage}</Text>
      ) : null}
    </AuthShell>
  );
}

function AuthShell({
  title,
  body,
  children,
}: React.PropsWithChildren<{ title: string; body: string }>) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 justify-center px-6 gap-5">
        <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
          movara
        </Text>
        <Text className="text-4xl font-extrabold leading-[42px] text-text">
          {title}
        </Text>
        <Text className="text-base leading-6 text-text-muted">{body}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}
