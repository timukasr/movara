import { Pressable, Text, View } from "react-native";

import { formatXp } from "@/constants/activity-xp";

import { getActivityIcon } from "./icons";
import { UserAvatar } from "./user-avatar";

type ActivityFeedCardProps = {
  memberName?: string;
  memberImageUrl?: string | null;
  name: string;
  sportType: string;
  distance: number;
  movingTime: number;
  timestamp: string | number;
  xp?: number | null;
  onPress?: () => void;
};

export function ActivityFeedCard({
  memberName,
  memberImageUrl,
  name,
  sportType,
  distance,
  movingTime,
  timestamp,
  xp,
  onPress,
}: ActivityFeedCardProps) {
  const Icon = getActivityIcon(sportType);

  const content = (
    <View className="flex-row gap-4">
      {/* User avatar with sport badge */}
      <View className="relative shrink-0">
        <UserAvatar imageUrl={memberImageUrl} name={memberName} size={48} />
        <View className="absolute -bottom-1 -right-1 items-center justify-center rounded-full bg-primary p-1.5">
          <Icon size={12} color="#571a00" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 gap-1">
        {/* Top row: description + XP */}
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            {memberName ? (
              <Text className="text-xs font-black uppercase tracking-wider text-primary">
                {memberName}
              </Text>
            ) : null}
            <Text className="text-sm leading-snug text-on-surface">{name}</Text>
          </View>
          {xp != null ? (
            <Text className="text-lg font-black text-primary">
              +{formatXp(xp)}XP
            </Text>
          ) : null}
        </View>

        {/* Stats row */}
        <View className="flex-row items-center gap-3 pt-1">
          <Text className="text-[10px] font-bold tracking-tight text-on-surface-variant">
            {formatDuration(movingTime)}
          </Text>
          {distance > 0 ? (
            <Text className="text-[10px] font-bold tracking-tight text-on-surface-variant">
              {formatDistance(distance)}
            </Text>
          ) : null}
          <Text className="text-[10px] font-bold tracking-tight text-on-surface-variant">
            {formatRelative(timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        className="relative overflow-hidden rounded-2xl bg-surface-container-low p-5 active:opacity-[0.88]"
        onPress={onPress}
      >
        <View className="absolute -right-4 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        {content}
      </Pressable>
    );
  }

  return (
    <View className="relative overflow-hidden rounded-2xl bg-surface-container-low p-5">
      <View className="absolute -right-4 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      {content}
    </View>
  );
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatRelative(value: string | number): string {
  const ts = typeof value === "string" ? Date.parse(value) : value;
  const now = Date.now();
  const diffMs = now - ts;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
