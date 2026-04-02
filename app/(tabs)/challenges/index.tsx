import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/lib/header";

export default function ChallengesScreen() {
  const router = useRouter();
  const challenges = useQuery(api.challenges.listMine);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-24">
        <View className="gap-3">
          <Text className="text-[34px] font-extrabold leading-10 text-on-surface">
            Challenges
          </Text>
          <Text className="text-base leading-6 text-on-surface-variant">
            Create a challenge, add people from Clerk, and keep your crew moving
            together.
          </Text>
        </View>

        <Pressable
          className="items-center rounded-full bg-primary px-5 py-4 active:opacity-[0.88]"
          onPress={() => router.push("/challenges/new")}
        >
          <Text className="text-base font-extrabold text-[#571a00]">
            Create challenge
          </Text>
        </Pressable>

        <View className="gap-3">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            My challenges
          </Text>

          {challenges === undefined ? (
            <ChallengeCard
              title="Loading challenges..."
              body="Fetching your current challenge memberships."
            />
          ) : challenges.length === 0 ? (
            <ChallengeCard
              title="No challenges yet"
              body="Start with a name, then add members from Clerk search."
            />
          ) : (
            challenges.map((challenge) => (
              <Pressable
                key={challenge.id}
                className="gap-2 rounded-[22px] border border-outline-variant/30 bg-surface-container p-[18px] active:opacity-[0.88]"
                onPress={() =>
                  router.push({
                    pathname: "/challenges/[challengeId]",
                    params: { challengeId: challenge.id },
                  })
                }
              >
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-[22px] font-bold leading-7 text-on-surface">
                    {challenge.name}
                  </Text>
                  <Text className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    {challenge.role}
                  </Text>
                </View>
                <Text className="text-sm leading-5 text-on-surface-variant">
                  {challenge.memberCount}{" "}
                  {challenge.memberCount === 1 ? "member" : "members"}.
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChallengeCard({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-2 rounded-[22px] border border-outline-variant/30 bg-surface-container p-[18px]">
      <Text className="text-[22px] font-bold leading-7 text-on-surface">
        {title}
      </Text>
      <Text className="text-sm leading-5 text-on-surface-variant">{body}</Text>
    </View>
  );
}
