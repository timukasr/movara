import { useAuth } from "@clerk/expo";
import { SignIn } from "@clerk/expo/web";
import { Redirect } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export function WebSignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>movara</Text>
          <Text style={styles.title}>Sign in on the web, test on Android.</Text>
          <Text style={styles.body}>
            Clerk renders the web auth UI here. Native keeps the same app route but uses the custom Google OAuth button.
          </Text>
        </View>

        <View style={styles.card}>
          <SignIn oauthFlow="auto" path="/sign-in" routing="path" fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
        </View>
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
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 24,
  },
  copy: {
    width: 320,
    gap: 12,
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
  card: {
    width: 380,
    minHeight: 520,
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#f5f7fb",
  },
});
