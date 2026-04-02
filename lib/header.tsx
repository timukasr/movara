import { useUser } from "@clerk/expo";
import { Image, Text, View } from "react-native";

export function AppHeader() {
  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <Text className="text-2xl font-black uppercase tracking-widest text-primary">
        MOVARA
      </Text>
      <UserAvatar />
    </View>
  );
}

function UserAvatar() {
  const { user } = useUser();

  const imageUrl = user?.imageUrl;
  const initials = getInitials(
    user?.firstName,
    user?.lastName,
    user?.primaryEmailAddress?.emailAddress,
  );

  if (imageUrl) {
    return (
      <View className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary">
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-primary">
      <Text className="text-sm font-bold text-primary">{initials}</Text>
    </View>
  );
}

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName[0].toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
  }

  return "?";
}
