import { useAuth } from "@clerk/expo";
import { SignIn } from "@clerk/expo/web";
import { Redirect } from "expo-router";
import { SafeAreaView, Text, View } from "react-native";

export function WebSignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 flex-row flex-wrap items-center justify-center p-8 gap-6">
        <View className="w-80 gap-3">
          <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
            movara
          </Text>
          <Text className="text-4xl font-extrabold leading-[42px] text-text">
            Sign in on the web, test on Android.
          </Text>
          <Text className="text-base leading-6 text-text-muted">
            Clerk renders the web auth UI here. Native keeps the same app route but uses the custom Google OAuth button.
          </Text>
        </View>

        <View className="w-[380px] min-h-[520px] rounded-3xl bg-text p-5">
          <SignIn oauthFlow="auto" path="/sign-in" routing="path" fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
        </View>
      </View>
    </SafeAreaView>
  );
}
