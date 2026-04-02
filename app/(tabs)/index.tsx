import { useUser } from "@clerk/expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatXp } from "@/constants/activity-xp";
import { api } from "@/convex/_generated/api";
import { ActivityFeedCard } from "@/lib/activity-feed-card";
import { useCurrentUser } from "@/lib/auth";
import { Card } from "@/lib/card";
import { AppHeader } from "@/lib/header";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { currentUser } = useCurrentUser();
  const totalXp = formatXp(currentUser?.totalXp);
  const firstName = user?.firstName ?? "there";
  const recentActivities = useQuery(api.activities.listRecent);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader />
      <ScrollView contentContainerClassName="gap-6 px-6 pb-24">
        {/* Hero: Profile & XP */}
        <Card>
          <View className="relative z-10 gap-3">
            <Text className="text-sm uppercase tracking-widest text-on-surface-variant">
              Good morning, {firstName}
            </Text>

            <Text className="text-5xl font-extrabold leading-none text-primary">
              <Text className="text-3xl text-on-surface">You have </Text>
              {totalXp}
              <Text className="text-3xl text-on-surface"> XP</Text>
            </Text>
          </View>

          <View className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </Card>

        {/* Log Activity */}
        <Pressable
          className="items-center rounded-full bg-primary py-4 active:opacity-[0.88]"
          onPress={() => router.push("/activities/new")}
        >
          <Text className="text-base font-extrabold text-[#571a00]">
            Log Activity
          </Text>
        </Pressable>

        {/* Recent Activities */}
        <View className="gap-4">
          <View className="flex-row items-end justify-between px-2">
            <Text className="text-xl font-black uppercase tracking-widest text-on-surface">
              Recent Activities
            </Text>
            <Pressable onPress={() => router.push("/activities")}>
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
            recentActivities.slice(0, 3).map((activity) => (
              <ActivityFeedCard
                key={activity.id}
                memberName={user?.firstName ?? undefined}
                memberImageUrl={user?.imageUrl}
                name={activity.name}
                sportType={activity.sportType}
                distance={activity.distance}
                movingTime={activity.movingTime}
                timestamp={activity.startDateLocal}
                xp={activity.xp}
                onPress={() =>
                  router.push({
                    pathname: "/activities/[id]",
                    params: { id: activity.id },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
