import { useUser } from "@clerk/expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { ActivityFeedCard } from "@/lib/activity-feed-card";
import { BackIcon } from "@/lib/icons";

export default function ActivitiesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const activities = useQuery(api.activities.listRecent);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-4 px-6 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <BackIcon size={24} color="#ff9066" />
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
            No activities yet. Log one or connect Strava in your profile.
          </Text>
        ) : (
          activities.map((activity) => (
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
      </ScrollView>
    </SafeAreaView>
  );
}
