import { useAuth } from "@clerk/expo";
import { useQuery } from "convex/react";
import { Redirect, useSegments, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";

const PUBLIC_ROUTE_SEGMENTS = new Set(["sign-in", "continue"]);

export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth();
  const currentUser = useQuery(
    api.users.current,
    isLoaded && isSignedIn ? {} : "skip",
  );

  return {
    isLoaded,
    isSignedIn,
    currentUser,
    isCurrentUserReady: Boolean(currentUser),
  };
}

export function AuthGate({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const { isLoaded, isSignedIn, isCurrentUserReady } = useCurrentUser();
  const isPublicRoute = PUBLIC_ROUTE_SEGMENTS.has(segments[0] ?? "");

  if (!isLoaded) {
    return (
      <AuthLoadingScreen
        title="Loading session"
        message="Checking your Clerk sign-in."
      />
    );
  }

  if (!isSignedIn) {
    return isPublicRoute ? children : <Redirect href={"/sign-in" as Href} />;
  }

  if (isPublicRoute) {
    return <Redirect href={"/" as Href} />;
  }

  if (!isCurrentUserReady) {
    return (
      <AuthLoadingScreen
        title="Setting up your account"
        message="Waiting for your Movara user to show up in Convex."
      />
    );
  }

  return children;
}

function AuthLoadingScreen({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="text-2xl font-extrabold text-on-surface">{title}</Text>
        <Text className="max-w-sm text-center text-sm leading-6 text-on-surface-variant">
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}
