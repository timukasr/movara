import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        {/* Background glow */}
        <View className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
          movara
        </Text>
        <Text className="text-center text-3xl font-black leading-tight text-on-surface">
          Challenges
        </Text>
        <Text className="max-w-xs text-center text-base leading-6 text-on-surface-variant">
          Compete with The Collective. Leaderboards and challenges coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
