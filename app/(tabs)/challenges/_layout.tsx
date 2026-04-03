import { useNavigation } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export default function ChallengesLayout() {
  const navigation = useNavigation();
  const router = useRouter();
  const isInitialMount = useRef(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      router.navigate("/challenges");
    });

    return unsubscribe;
  }, [navigation, router]);

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
