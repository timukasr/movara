import { Stack } from "expo-router";

export default function ChallengesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#240304" },
        animation: "slide_from_right",
      }}
    />
  );
}
