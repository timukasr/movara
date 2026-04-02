import { useUser } from "@clerk/expo";
import { Text, View } from "react-native";

import { UserAvatar } from "@/lib/user-avatar";

export function AppHeader() {
  const { user } = useUser();

  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <Text className="text-2xl font-black uppercase tracking-widest text-primary">
        MOVARA
      </Text>
      <UserAvatar
        imageUrl={user?.imageUrl}
        name={[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
        email={user?.primaryEmailAddress?.emailAddress}
      />
    </View>
  );
}
