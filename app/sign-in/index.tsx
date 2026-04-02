import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useSSO } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [submitting, setSubmitting] = React.useState<"google" | "apple" | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-on-surface-variant text-lg font-medium">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  const handleSSO = async (strategy: "oauth_google" | "oauth_apple") => {
    const provider = strategy === "oauth_google" ? "google" : "apple";
    setSubmitting(provider);
    setErrorMessage(null);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
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
      console.error(`${provider} OAuth failed`, error);
      setErrorMessage(error instanceof Error ? error.message : `${provider} sign-in failed.`);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        {/* Background glow orbs */}
        <View className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <View className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-surface-variant/40 blur-3xl" />

        {/* Logo */}
        <View className="mb-12">
          <Text className="text-3xl font-black tracking-[6px] text-on-surface">
            MOVARA
          </Text>
        </View>

        {/* Welcome message */}
        <View className="mb-16 max-w-sm items-center">
          <Text className="mb-4 text-center text-4xl font-black tracking-tighter text-on-surface leading-none">
            Ignite Your Progress
          </Text>
          <Text className="text-center text-lg font-medium leading-relaxed text-on-surface-variant">
            Welcome to the Collective. Your evolution starts here.
          </Text>
        </View>

        {/* Auth buttons */}
        <View className="w-full max-w-xs gap-4">
          {/* Google */}
          <Pressable
            className={`w-full flex-row items-center justify-center gap-3 rounded-full border border-outline-variant/15 bg-surface-container-high px-6 py-4 ${
              submitting === "google" ? "opacity-55" : submitting ? "opacity-40" : "active:scale-95 active:opacity-90"
            }`}
            disabled={submitting !== null}
            onPress={() => handleSSO("oauth_google")}
          >
            <Text className="text-[18px] text-error">G</Text>
            <Text className="text-base font-bold tracking-tight text-on-surface">
              {submitting === "google" ? "Opening Google..." : "Continue with Google"}
            </Text>
          </Pressable>

          {/* Apple */}
          <Pressable
            className={`w-full flex-row items-center justify-center gap-3 rounded-full bg-on-surface px-6 py-4 ${
              submitting === "apple" ? "opacity-55" : submitting ? "opacity-40" : "active:scale-95 active:opacity-90"
            }`}
            disabled={submitting !== null}
            onPress={() => handleSSO("oauth_apple")}
          >
            <Text className="text-[18px] text-surface-container-lowest">&#xF8FF;</Text>
            <Text className="text-base font-bold tracking-tight text-surface-container-lowest">
              {submitting === "apple" ? "Opening Apple..." : "Continue with Apple"}
            </Text>
          </Pressable>
        </View>

        {/* Error message */}
        {errorMessage ? (
          <Text className="mt-4 text-center text-sm leading-5 text-error">
            {errorMessage}
          </Text>
        ) : null}

        {/* Decorative accent bar */}
        <View className="mt-24 h-1 w-12 rounded-full bg-primary opacity-50" />
      </View>

      {/* Footer */}
      <View className="p-8">
        <Text className="text-center text-xs font-medium uppercase tracking-widest text-on-surface-variant/60">
          Performance • Community • Velocity
        </Text>
      </View>
    </SafeAreaView>
  );
}
