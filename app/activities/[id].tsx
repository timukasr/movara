import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/lib/card";
import { getActivityIcon } from "@/lib/icons";

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const activityId =
    typeof id === "string" && id !== "index"
      ? (id as Id<"stravaActivities">)
      : null;

  useEffect(() => {
    if (id === "index") {
      router.replace("/activities");
    }
  }, [id, router]);

  const activity = useQuery(
    api.strava.getActivity,
    activityId ? { id: activityId } : "skip",
  );

  if (id === "index") {
    return null;
  }

  if (!activityId) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header onBack={() => router.replace("/activities")} />
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="text-lg font-bold text-on-surface">
            Invalid activity link
          </Text>
          <Text className="text-sm text-on-surface-variant">
            This activity URL is missing a valid activity id.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (activity === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-on-surface-variant">Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (activity === null) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="text-lg font-bold text-on-surface">
            Activity not found
          </Text>
          <Text className="text-sm text-on-surface-variant">
            It may have been deleted or you don't have access.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const Icon = getActivityIcon(activity.sportType);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header onBack={() => router.back()} />
      <ScrollView contentContainerClassName="gap-6 px-6 pb-24">
        {/* Hero */}
        <Card>
          <View className="relative z-10 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon size={36} color="#ff9066" />
            </View>
            <Text className="text-center text-2xl font-black text-on-surface">
              {activity.name}
            </Text>
            <Text className="text-sm uppercase tracking-widest text-on-surface-variant">
              {activity.sportType}
            </Text>
            <Text className="text-sm text-on-surface-variant">
              {formatFullDate(activity.startDateLocal)} • {activity.timezone}
            </Text>
          </View>
          <View className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </Card>

        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-4">
          <StatCard
            label="Distance"
            value={formatDistance(activity.distance)}
          />
          <StatCard
            label="Moving Time"
            value={formatDuration(activity.movingTime)}
          />
          <StatCard
            label="Elapsed Time"
            value={formatDuration(activity.elapsedTime)}
          />
          <StatCard
            label="Elevation Gain"
            value={`${Math.round(activity.totalElevationGain)} m`}
          />
          {activity.averageSpeed != null ? (
            <StatCard
              label="Avg Speed"
              value={`${(activity.averageSpeed * 3.6).toFixed(1)} km/h`}
            />
          ) : null}
          {activity.movingTime > 0 && activity.distance > 0 ? (
            <StatCard
              label="Avg Pace"
              value={formatPace(activity.movingTime, activity.distance)}
            />
          ) : null}
        </View>

        {/* Details */}
        <Card bg="bg-surface-container">
          <View className="gap-4">
            <DetailRow label="Type" value={activity.type} />
            <DetailRow label="Sport Type" value={activity.sportType} />
            <DetailRow label="Strava ID" value={activity.stravaActivityId} />
            <DetailRow
              label="Visibility"
              value={activity.isPrivate ? "Private" : "Public"}
            />
            <DetailRow label="Timezone" value={activity.timezone} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center gap-4 px-6 py-4">
      <Pressable onPress={onBack} className="active:opacity-70">
        <Text className="text-2xl text-primary">←</Text>
      </Pressable>
      <Text className="text-2xl font-black uppercase tracking-widest text-primary">
        Activity
      </Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-3xl bg-surface-container-high p-5">
      <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-extrabold text-on-surface">
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-on-surface-variant">{label}</Text>
      <Text className="text-sm font-bold text-on-surface">{value}</Text>
    </View>
  );
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

function formatPace(movingTimeSeconds: number, distanceMeters: number): string {
  const paceSecondsPerKm = movingTimeSeconds / (distanceMeters / 1000);
  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.round(paceSecondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, "0")}" /km`;
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
