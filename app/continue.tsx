import * as React from "react";
import { useAuth, useClerk, useSignIn, useSignUp } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <Text style={styles.eyebrow}>movara</Text>
        <Text style={styles.title}>Continue auth</Text>
        <Text style={styles.body}>{message}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace("/sign-in" as Href)}
        >
          <Text style={styles.buttonText}>Back to sign in</Text>
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
  },
  body: {
    color: "#9eb2c7",
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#7ef5c5",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#05111d",
    fontSize: 15,
    fontWeight: "800",
  },
});
