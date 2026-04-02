import { useUser } from "@clerk/expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { Card } from "@/lib/card";
import { AppHeader } from "@/lib/header";
import { getActivityIcon } from "@/lib/icons";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const firstName = user?.firstName ?? "there";
  const recentActivities = useQuery(api.strava.listRecentActivities);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader />
      <ScrollView contentContainerClassName="gap-6 px-6 pb-24">
        {/* Hero: Profile & XP */}
        <Card>
          <View className="relative z-10 gap-2">
            <Text className="text-sm uppercase tracking-widest text-on-surface-variant">
              Good morning, {firstName}
            </Text>
            <Text className="text-4xl font-black leading-tight text-on-surface">
              YOU'RE ON A{"\n"}
              <Text className="text-primary">12-DAY STREAK</Text>
            </Text>
          </View>

          <View className="relative z-10 mt-8">
            <Text className="text-xs uppercase text-on-surface-variant">
              Total XP Earned
            </Text>
            <Text className="text-5xl font-extrabold text-on-surface">
              24,580
            </Text>
          </View>

          <View className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </Card>

        {/* Recent Activities */}
        <View className="gap-4">
          <View className="flex-row items-end justify-between px-2">
            <Text className="text-xl font-black uppercase tracking-widest text-on-surface">
              Recent Activities
            </Text>
            <Pressable onPress={() => router.push("/activities/index")}>
              <Text className="text-sm font-bold text-primary">View All</Text>
            </Pressable>
          </View>

          {recentActivities === undefined ? (
            <Card bg="bg-surface-container-low">
              <Text className="text-sm text-on-surface-variant">
                Loading activities...
              </Text>
            </Card>
          ) : recentActivities.length === 0 ? (
            <Card bg="bg-surface-container-low">
              <Text className="text-lg font-bold text-on-surface">
                No activities yet
              </Text>
              <Text className="mt-1 text-sm text-on-surface-variant">
                Connect Strava in your profile to import activities.
              </Text>
            </Card>
          ) : (
            recentActivities
              .slice(0, 3)
              .map((activity) => (
                <ActivityRow
                  key={activity.stravaActivityId}
                  id={activity.id}
                  name={activity.name}
                  sportType={activity.sportType}
                  distance={activity.distance}
                  movingTime={activity.movingTime}
                  startDateLocal={activity.startDateLocal}
                />
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityRow({
  id,
  name,
  sportType,
  distance,
  movingTime,
  startDateLocal,
}: {
  id: string;
  name: string;
  sportType: string;
  distance: number;
  movingTime: number;
  startDateLocal: string;
}) {
  const router = useRouter();
  const Icon = getActivityIcon(sportType);

  return (
    <Pressable
      className="flex-row items-center justify-between rounded-3xl bg-surface-container-low p-5 active:opacity-[0.88]"
      onPress={() =>
        router.push({ pathname: "/activities/[id]", params: { id } })
      }
    >
      <View className="flex-row items-center gap-5">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon size={28} color="#ff9066" />
        </View>
        <View>
          <Text className="text-lg font-bold text-on-surface">{name}</Text>
          <Text className="text-sm text-on-surface-variant">
            {formatDuration(movingTime)} • {formatDistance(distance)}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-[10px] font-bold uppercase text-on-surface-variant">
          {formatRelativeDate(startDateLocal)}
        </Text>
      </View>
    </Pressable>
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

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
