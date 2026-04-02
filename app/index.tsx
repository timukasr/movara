import { useClerk, useUser } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useConvexAuth, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const api = anyApi as any;

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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in" as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>movara</Text>
        <Text style={styles.title}>Clerk signs users in. Convex tells us who they are.</Text>
        <Text style={styles.subtitle}>
          Quick hackathon shell for building the real app on top of a working auth + backend loop.
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

        <View style={styles.card}>
          <Text style={styles.cardLabel}>What is wired</Text>
          <Text style={styles.listItem}>Google OAuth through Clerk</Text>
          <Text style={styles.listItem}>Protected Expo Router screen</Text>
          <Text style={styles.listItem}>Authenticated Convex sample query</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  cardLabel: {
    color: "#7ef5c5",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
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
  listItem: {
    color: "#d6dfeb",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#7ef5c5",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#05111d",
    fontSize: 16,
    fontWeight: "800",
  },
});
