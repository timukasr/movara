import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        {/* Background glow */}
        <View className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
          movara
        </Text>
        <Text className="text-center text-3xl font-black leading-tight text-on-surface">
          Dashboard
        </Text>
        <Text className="max-w-xs text-center text-base leading-6 text-on-surface-variant">
          Your streak, daily goals, and recent activities will live here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
