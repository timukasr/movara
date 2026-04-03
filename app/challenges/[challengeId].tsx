import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatXp } from "@/constants/activity-xp";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ActivityFeedCard } from "@/lib/activity-feed-card";
import { BottomNavBar, NavBarItem } from "@/lib/bottom-nav";
import { Card } from "@/lib/card";
import { ActivityIcon, BackIcon, SettingsIcon, TrophyIcon } from "@/lib/icons";
import { UserAvatar } from "@/lib/user-avatar";

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
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/challenges");
            }
          }}
          className="active:opacity-70"
        >
          <BackIcon size={24} color="#ff9066" />
        </Pressable>
        <Text
          className="flex-1 text-center text-2xl font-black uppercase tracking-widest text-primary"
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
            {member.currentXp >= challenge.goalXp ? (
              <Text className="rounded-full bg-[#1A2E25] px-3 py-1 text-sm font-extrabold text-[#7ef5c5]">
                Finished
              </Text>
            ) : (
              <Text className="text-lg font-extrabold text-primary">
                {formatXp(member.currentXp)} XP
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- Feed Tab ---

function FeedTab({ challengeId }: { challengeId: string | null }) {
  const router = useRouter();
  const sendMessage = useMutation(api.challenges.sendMessage);
  const feedItems = useQuery(
    api.challenges.getActivityFeed,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip",
  );
  const scrollRef = React.useRef<ScrollView>(null);
  const [messageText, setMessageText] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    if (!challengeId || sending || !messageText.trim()) return;

    setSending(true);
    try {
      await sendMessage({
        challengeId: challengeId as Id<"challenges">,
        text: messageText,
      });
      setMessageText("");
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1">
      {feedItems === undefined ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-on-surface-variant">Loading feed...</Text>
        </View>
      ) : feedItems.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="text-lg font-bold text-on-surface">
            No activity yet
          </Text>
          <Text className="text-center text-sm text-on-surface-variant">
            Activities and messages from challenge members will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="gap-4 px-6 pb-4 pt-4"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {feedItems.map((item) => {
            if (item.kind === "message") {
              return (
                <View
                  key={item.id}
                  className="flex-row items-start gap-4 rounded-3xl bg-surface-container p-5"
                >
                  <UserAvatar
                    imageUrl={item.memberImageUrl}
                    name={item.memberName}
                    size={48}
                  />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-primary">
                      {item.memberName}
                    </Text>
                    <Text className="mt-1 text-base leading-6 text-on-surface">
                      {item.text}
                    </Text>
                    <Text className="mt-2 text-[10px] font-bold text-on-surface-variant">
                      {formatRelativeTimestamp(item.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <ActivityFeedCard
                key={item.id}
                memberName={item.memberName}
                memberImageUrl={item.memberImageUrl}
                name={item.name}
                sportType={item.sportType}
                distance={item.distance}
                movingTime={item.movingTime}
                timestamp={item.timestamp}
                xp={item.xp}
                onPress={() =>
                  router.push({
                    pathname: "/activities/[id]",
                    params: { id: item.id },
                  })
                }
              />
            );
          })}
        </ScrollView>
      )}

      {/* Message input */}
      <View className="flex-row items-center gap-3 border-t border-outline-variant/20 px-6 py-3">
        <TextInput
          className="flex-1 rounded-2xl bg-surface-container-high px-4 py-3 text-base text-on-surface"
          placeholder="Leave a message..."
          placeholderTextColor="#b69290"
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />
        <Pressable
          className={`rounded-full bg-primary px-4 py-3 ${
            sending || !messageText.trim() ? "opacity-40" : "active:opacity-80"
          }`}
          disabled={sending || !messageText.trim()}
          onPress={handleSend}
        >
          <Text className="text-sm font-extrabold text-[#571a00]">Send</Text>
        </Pressable>
      </View>
    </View>
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

function formatRelativeTimestamp(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
