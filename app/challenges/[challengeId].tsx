import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatXp } from "@/constants/activity-xp";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BottomNavBar, NavBarItem } from "@/lib/bottom-nav";
import { Card } from "@/lib/card";
import {
  ActivityIcon,
  BackIcon,
  getActivityIcon,
  SettingsIcon,
  TrophyIcon,
} from "@/lib/icons";

type Tab = "overview" | "feed";

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string | string[] }>();
  const challengeId =
    typeof params.challengeId === "string" ? params.challengeId : null;
  const [activeTab, setActiveTab] = React.useState<Tab>("overview");

  const challenge = useQuery(
    api.challenges.getOne,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip",
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <BackIcon size={24} color="#ff9066" />
        </Pressable>
        <Text
          className="flex-1 text-center text-lg font-black uppercase tracking-widest text-primary"
          numberOfLines={1}
        >
          {challenge?.name ?? "Challenge"}
        </Text>
        {challengeId ? (
          <Pressable
            onPress={() => router.push(`../challenge-settings/${challengeId}`)}
            className="active:opacity-70"
          >
            <SettingsIcon size={24} color="#ff9066" />
          </Pressable>
        ) : (
          <View className="w-6" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        {activeTab === "overview" ? (
          <OverviewTab challenge={challenge} />
        ) : (
          <FeedTab challengeId={challengeId} />
        )}
      </View>

      {/* Bottom tab bar */}
      <BottomNavBar>
        <NavBarItem
          active={activeTab === "overview"}
          title="Overview"
          onPress={() => setActiveTab("overview")}
        >
          <TrophyIcon
            size={22}
            color={activeTab === "overview" ? "#fff" : "#dd9a97"}
            fill={activeTab === "overview"}
          />
        </NavBarItem>
        <NavBarItem
          active={activeTab === "feed"}
          title="Feed"
          onPress={() => setActiveTab("feed")}
        >
          <ActivityIcon
            size={22}
            color={activeTab === "feed" ? "#fff" : "#dd9a97"}
          />
        </NavBarItem>
      </BottomNavBar>
    </SafeAreaView>
  );
}

// --- Overview Tab ---

type ChallengeData = NonNullable<
  ReturnType<typeof useQuery<typeof api.challenges.getOne>>
>;

function OverviewTab({
  challenge,
}: {
  challenge: ChallengeData | undefined | null;
}) {
  if (challenge === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-variant">Loading...</Text>
      </View>
    );
  }

  if (challenge === null) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-bold text-on-surface">
          Challenge unavailable
        </Text>
        <Text className="mt-1 text-sm text-on-surface-variant">
          You do not have access, or it no longer exists.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-5 px-6 pb-6 pt-4">
      <Card>
        <View className="relative z-10 gap-2">
          <Text className="text-sm uppercase tracking-widest text-on-surface-variant">
            Goal
          </Text>
          <Text className="text-4xl font-black text-on-surface">
            {formatXp(challenge.goalXp)} XP
          </Text>
          <Text className="text-sm text-on-surface-variant">
            {formatDateRange(challenge.startAt, challenge.endAt)}
          </Text>
        </View>
        <View className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </Card>

      <View className="gap-4">
        <Text className="px-2 text-xl font-black uppercase tracking-widest text-on-surface">
          Leaderboard
        </Text>
        {challenge.members.map((member, index) => (
          <View
            key={member.id}
            className="flex-row items-center justify-between rounded-3xl bg-surface-container-low p-5"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Text className="text-lg font-black text-primary">
                  {index + 1}
                </Text>
              </View>
              <View className="gap-1">
                <Text className="text-[15px] font-bold text-on-surface">
                  {member.name}
                </Text>
                <Text className="text-[13px] text-on-surface-variant">
                  {member.role === "owner" ? "Owner" : "Member"}
                </Text>
              </View>
            </View>
            <Text className="text-lg font-extrabold text-primary">
              {formatXp(member.currentXp)} XP
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- Feed Tab ---

function FeedTab({ challengeId }: { challengeId: string | null }) {
  const router = useRouter();
  const activities = useQuery(
    api.challenges.getActivityFeed,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip",
  );

  if (activities === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-variant">Loading feed...</Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-lg font-bold text-on-surface">
          No activities yet
        </Text>
        <Text className="text-center text-sm text-on-surface-variant">
          Activities from challenge members will show up here once imported from
          Strava.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-4 px-6 pb-6 pt-4">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.sportType);

        return (
          <Pressable
            key={activity.id}
            className="rounded-3xl bg-surface-container-low p-5 active:opacity-[0.88]"
            onPress={() =>
              router.push({
                pathname: "/activities/[id]",
                params: { id: activity.id },
              })
            }
          >
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Icon size={24} color="#ff9066" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-xs font-bold text-primary">
                  {activity.memberName}
                </Text>
                <Text className="text-base font-bold text-on-surface">
                  {activity.name}
                </Text>
                <Text className="text-sm text-on-surface-variant">
                  {formatDuration(activity.movingTime)} •{" "}
                  {formatDistance(activity.distance)}
                  {activity.xp != null ? ` • ${formatXp(activity.xp)} XP` : ""}
                </Text>
              </View>
            </View>
            <Text className="mt-2 text-[10px] font-bold uppercase text-on-surface-variant">
              {formatRelativeDate(activity.startDateLocal)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// --- Formatters ---

function formatDateRange(startAt: number, endAt: number) {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${new Date(startAt).toLocaleDateString(undefined, options)} - ${new Date(endAt).toLocaleDateString(undefined, options)}`;
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

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
