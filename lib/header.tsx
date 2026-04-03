import { useUser } from "@clerk/expo";
import { Text, View } from "react-native";

import { UserAvatar } from "@/lib/user-avatar";

export function AppHeader({ hideAvatar }: { hideAvatar?: boolean } = {}) {
  const { user } = useUser();

  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <Text className="text-2xl font-black uppercase tracking-widest text-primary">
        MOVARA
      </Text>
      {hideAvatar ? null : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            shadowColor: "#ff9066",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <UserAvatar
            imageUrl={user?.imageUrl}
            name={[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
            email={user?.primaryEmailAddress?.emailAddress}
          />
        </View>
      )}
    </View>
  );
}
