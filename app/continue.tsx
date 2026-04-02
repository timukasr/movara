import * as React from "react";
import { useAuth, useClerk, useSignIn, useSignUp } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContinueScreen() {
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const hasHandled = React.useRef(false);
  const [message, setMessage] = React.useState("Wrapping up Google sign-in...");

  React.useEffect(() => {
    if (!clerk.loaded || hasHandled.current) {
      return;
    }

    hasHandled.current = true;

    const finish = async () => {
      try {
        if (signIn.status === "complete") {
          await signIn.finalize({
            navigate: async ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                setMessage("This session needs more steps in Clerk. Sending you back to sign-in.");
                router.replace("/sign-in" as Href);
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

        if (signUp.status === "complete") {
          await signUp.finalize({
            navigate: async ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                setMessage("This session needs more steps in Clerk. Sending you back to sign-in.");
                router.replace("/sign-in" as Href);
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

        const sessionId = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
        if (sessionId) {
          await clerk.setActive({
            session: sessionId,
            navigate: async ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                setMessage("This session needs more steps in Clerk. Sending you back to sign-in.");
                router.replace("/sign-in" as Href);
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

        setMessage("Google returned, but Clerk did not finish a session. Start again from sign-in.");
      } catch (error) {
        console.error("Could not finalize OAuth flow", error);
        setMessage(error instanceof Error ? error.message : "Could not finish sign-in. Start again.");
      }
    };

    void finish();
  }, [clerk, router, signIn, signUp]);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
          movara
        </Text>
        <Text className="text-3xl font-extrabold text-on-surface">Continue auth</Text>
        <Text className="text-base leading-6 text-on-surface-variant">{message}</Text>
        <Pressable
          className="mt-3 self-start rounded-full bg-primary-container px-5 py-3.5 active:opacity-80"
          onPress={() => router.replace("/sign-in" as Href)}
        >
          <Text className="text-[15px] font-extrabold text-on-primary-container">Back to sign in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
