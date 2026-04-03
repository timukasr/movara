import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/lib/card";
import { getActivityIcon } from "@/lib/icons";

const SPORT_TYPES = [
  "Run",
  "Ride",
  "Swim",
  "Walk",
  "Hike",
  "Yoga",
  "Workout",
  "Other",
];

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const activityId =
    typeof id === "string" && id !== "index" ? (id as Id<"activities">) : null;

  useEffect(() => {
    if (id === "index") {
      router.replace("/activities");
    }
  }, [id, router]);

  const activity = useQuery(
    api.activities.getOne,
    activityId ? { id: activityId } : "skip",
  );

  const updateActivity = useMutation(api.activities.update);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSportType, setEditSportType] = useState("Run");
  const [editDistanceKm, setEditDistanceKm] = useState("");
  const [editDurationMin, setEditDurationMin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canEdit = activity?.isOwner && !activity.stravaActivityId;

  const startEditing = () => {
    if (!activity) return;
    setEditName(activity.name);
    setEditSportType(activity.sportType);
    setEditDistanceKm((activity.distance / 1000).toString());
    setEditDurationMin(Math.round(activity.movingTime / 60).toString());
    setErrorMessage(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (submitting || !activityId) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setErrorMessage("Give your activity a name.");
      return;
    }

    const distance = Number(editDistanceKm) * 1000;
    const movingTime = Number(editDurationMin) * 60;

    if (!Number.isFinite(distance) || distance < 0) {
      setErrorMessage("Enter a valid distance.");
      return;
    }

    if (!Number.isFinite(movingTime) || movingTime <= 0) {
      setErrorMessage("Enter a valid duration.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await updateActivity({
        id: activityId,
        name: trimmedName,
        sportType: editSportType,
        distance,
        movingTime,
      });
      setEditing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save changes.",
      );
    } finally {
      setSubmitting(false);
    }
  };

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

  if (editing) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center gap-4">
            <Pressable onPress={cancelEditing} className="active:opacity-70">
              <Text className="text-2xl text-primary">←</Text>
            </Pressable>
            <Text className="text-2xl font-black uppercase tracking-widest text-primary">
              Edit
            </Text>
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-5 px-6 pb-24">
          <Card compact bg="bg-surface-container">
            <View className="gap-4">
              <View className="gap-1">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Name
                </Text>
                <TextInput
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Sport type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SPORT_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setEditSportType(type)}
                      className={`rounded-full px-4 py-2 ${
                        editSportType === type
                          ? "bg-primary"
                          : "border border-outline-variant/30 bg-surface-container-high"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          editSportType === type
                            ? "text-[#571a00]"
                            : "text-on-surface"
                        }`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Distance (km)
                </Text>
                <TextInput
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
                  value={editDistanceKm}
                  onChangeText={setEditDistanceKm}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Duration (minutes)
                </Text>
                <TextInput
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
                  value={editDurationMin}
                  onChangeText={setEditDurationMin}
                  keyboardType="numeric"
                />
              </View>

              {errorMessage ? (
                <Text className="text-sm leading-5 text-error">
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          </Card>

          <Pressable
            className={`items-center rounded-full bg-primary px-5 py-4 ${
              submitting ? "opacity-55" : "active:opacity-[0.88]"
            }`}
            disabled={submitting}
            onPress={handleSave}
          >
            <Text className="text-base font-extrabold text-[#571a00]">
              {submitting ? "Saving..." : "Save changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const Icon = getActivityIcon(activity.sportType);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-70"
          >
            <Text className="text-2xl text-primary">←</Text>
          </Pressable>
          <Text className="text-2xl font-black uppercase tracking-widest text-primary">
            Activity
          </Text>
        </View>
        {canEdit ? (
          <Pressable onPress={startEditing} className="active:opacity-70">
            <Text className="text-sm font-bold text-primary">Edit</Text>
          </Pressable>
        ) : null}
      </View>
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
              {formatFullDate(activity.startDateLocal ?? activity.startDate)}
              {activity.timezone ? ` • ${activity.timezone}` : ""}
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
          {activity.elapsedTime != null ? (
            <StatCard
              label="Elapsed Time"
              value={formatDuration(activity.elapsedTime)}
            />
          ) : null}
          {activity.totalElevationGain != null ? (
            <StatCard
              label="Elevation Gain"
              value={`${Math.round(activity.totalElevationGain)} m`}
            />
          ) : null}
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
            <DetailRow label="Sport Type" value={activity.sportType} />
            {activity.type ? (
              <DetailRow label="Type" value={activity.type} />
            ) : null}
            {activity.stravaActivityId ? (
              <DetailRow label="Strava ID" value={activity.stravaActivityId} />
            ) : null}
            {activity.isPrivate != null ? (
              <DetailRow
                label="Visibility"
                value={activity.isPrivate ? "Private" : "Public"}
              />
            ) : null}
            {activity.timezone ? (
              <DetailRow label="Timezone" value={activity.timezone} />
            ) : null}
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
