import { Image, Text, View } from "react-native";

type UserAvatarProps = {
  imageUrl?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({
  imageUrl,
  name,
  email,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const initials = getUserInitials(name, email);

  if (imageUrl) {
    return (
      <View
        className={`overflow-hidden rounded-full border-2 border-primary ${className}`}
        style={{ height: size, width: size }}
      >
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      className={`items-center justify-center rounded-full border-2 border-primary bg-primary/10 ${className}`}
      style={{ height: size, width: size }}
    >
      <Text className="text-sm font-bold uppercase text-primary">
        {initials}
      </Text>
    </View>
  );
}

function getUserInitials(name?: string | null, email?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean).slice(0, 2) ?? [];

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
  }

  return "?";
}
