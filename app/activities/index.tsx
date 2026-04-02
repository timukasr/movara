import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { getActivityIcon } from "@/lib/icons";

export default function ActivitiesScreen() {
  const router = useRouter();
  const activities = useQuery(api.strava.listRecentActivities);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-4 px-6 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <Text className="text-2xl text-primary">←</Text>
        </Pressable>
        <Text className="text-2xl font-black uppercase tracking-widest text-primary">
          Activities
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-6 pb-24">
        {activities === undefined ? (
          <Text className="text-sm text-on-surface-variant">
            Loading activities...
          </Text>
        ) : activities.length === 0 ? (
          <Text className="text-sm text-on-surface-variant">
            No activities imported yet. Connect Strava in your profile.
          </Text>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.sportType);

            return (
              <Pressable
                key={activity.stravaActivityId}
                className="flex-row items-center justify-between rounded-3xl bg-surface-container-low p-5 active:opacity-[0.88]"
                onPress={() =>
                  router.push({
                    pathname: "/activities/[id]",
                    params: { id: activity.id },
                  })
                }
              >
                <View className="flex-row items-center gap-5">
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon size={28} color="#ff9066" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-on-surface">
                      {activity.name}
                    </Text>
                    <Text className="text-sm text-on-surface-variant">
                      {formatDuration(activity.movingTime)} •{" "}
                      {formatDistance(activity.distance)}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-bold text-on-surface-variant">
                    {formatDate(activity.startDateLocal)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
