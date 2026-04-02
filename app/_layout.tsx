import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";

import { AuthGate } from "@/lib/auth";
import { convex } from "@/lib/convex";
import { env } from "@/lib/env";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthGate>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#240304" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          </Stack>
        </AuthGate>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
