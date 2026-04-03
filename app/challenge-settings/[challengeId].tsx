import { useAction, useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatXp } from "@/constants/activity-xp";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/lib/card";
import { BackIcon } from "@/lib/icons";

type SearchResult = {
  userId: Id<"users">;
  displayName: string;
  primaryEmail: string | null;
  imageUrl: string | null;
};

export default function ChallengeSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string | string[] }>();
  const challengeId =
    typeof params.challengeId === "string" ? params.challengeId : null;
  const challenge = useQuery(
    api.challenges.getOne,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip",
  );
  const searchUsers = useAction(api.challenges.searchClerkUsers);
  const addMember = useMutation(api.challenges.addMember);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [addingUserId, setAddingUserId] = React.useState<Id<"users"> | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!challengeId || !challenge?.canManageMembers) {
      setResults([]);
      setSearching(false);
      return;
    }

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timeout = setTimeout(() => {
      void searchUsers({
        challengeId: challengeId as Id<"challenges">,
        query: normalizedQuery,
      })
        .then((nextResults) => {
          if (cancelled) return;
          setResults(nextResults);
          setErrorMessage(null);
        })
        .catch((error) => {
          if (cancelled) return;
          setResults([]);
          setErrorMessage(
            error instanceof Error ? error.message : "Could not search users.",
          );
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [challenge?.canManageMembers, challengeId, query, searchUsers]);

  const handleAddMember = async (result: SearchResult) => {
    if (!challengeId || addingUserId) return;

    setAddingUserId(result.userId);
    setErrorMessage(null);

    try {
      await addMember({
        challengeId: challengeId as Id<"challenges">,
        memberUserId: result.userId,
      });
      setQuery("");
      setResults([]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not add member.",
      );
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-4 px-6 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <BackIcon size={24} color="#ff9066" />
        </Pressable>
        <Text className="text-2xl font-black uppercase tracking-widest text-primary">
          Settings
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-6 pb-24">
        {challenge === undefined ? (
          <Text className="text-sm text-on-surface-variant">
            Loading challenge settings...
          </Text>
        ) : challenge === null ? (
          <Text className="text-sm text-on-surface-variant">
            Challenge not found.
          </Text>
        ) : (
          <>
            <Card compact bg="bg-surface-container">
              <View className="gap-3">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Challenge name
                </Text>
                <Text className="text-[22px] font-bold leading-7 text-on-surface">
                  {challenge.name}
                </Text>
              </View>
            </Card>

            <Card compact bg="bg-surface-container">
              <View className="gap-3">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Goal
                </Text>
                <Text className="text-[22px] font-bold leading-7 text-on-surface">
                  {formatXp(challenge.goalXp)} XP
                </Text>
                <Text className="text-sm leading-5 text-on-surface-variant">
                  {formatDateRange(challenge.startAt, challenge.endAt)}
                </Text>
              </View>
            </Card>

            <Card compact bg="bg-surface-container">
              <View className="gap-3">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  Members ({challenge.members.length})
                </Text>
                {challenge.members.map((member) => (
                  <View
                    key={member.id}
                    className="flex-row items-center justify-between gap-3 rounded-2xl bg-surface-container-high px-4 py-3"
                  >
                    <View className="flex-1 gap-1">
                      <Text className="text-[15px] font-bold text-on-surface">
                        {member.name}
                      </Text>
                      <Text className="text-[13px] text-on-surface-variant">
                        {member.role === "owner" ? "Owner" : "Member"}
                      </Text>
                    </View>
                    <Text className="text-sm font-extrabold text-primary">
                      {formatXp(member.currentXp)} XP
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            {challenge.canManageMembers ? (
              <Card compact bg="bg-surface-container">
                <View className="gap-3">
                  <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                    Add members
                  </Text>
                  <TextInput
                    className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
                    placeholder="Search by name, username, or email"
                    placeholderTextColor="#b69290"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {errorMessage ? (
                    <Text className="text-sm leading-5 text-error">
                      {errorMessage}
                    </Text>
                  ) : null}

                  {query.trim().length < 2 ? (
                    <Text className="text-sm leading-5 text-on-surface-variant">
                      Type at least two characters to search Clerk users.
                    </Text>
                  ) : searching ? (
                    <Text className="text-sm leading-5 text-on-surface-variant">
                      Searching Clerk...
                    </Text>
                  ) : results.length === 0 ? (
                    <Text className="text-sm leading-5 text-on-surface-variant">
                      No matching users found.
                    </Text>
                  ) : (
                    results.map((result) => (
                      <View
                        key={result.userId}
                        className="flex-row items-center gap-3 rounded-2xl bg-surface-container-high px-4 py-3"
                      >
                        <View className="flex-1 gap-1">
                          <Text className="text-[15px] font-bold text-on-surface">
                            {result.displayName}
                          </Text>
                          <Text className="text-[13px] text-on-surface-variant">
                            {result.primaryEmail ?? "No public email"}
                          </Text>
                        </View>
                        <Pressable
                          className={`rounded-full bg-primary px-4 py-2 ${
                            addingUserId === result.userId
                              ? "opacity-55"
                              : "active:opacity-[0.88]"
                          }`}
                          disabled={addingUserId !== null}
                          onPress={() => handleAddMember(result)}
                        >
                          <Text className="text-sm font-extrabold text-[#571a00]">
                            {addingUserId === result.userId
                              ? "Adding..."
                              : "Add"}
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateRange(startAt: number, endAt: number) {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  return `${new Date(startAt).toLocaleDateString(undefined, options)} - ${new Date(endAt).toLocaleDateString(undefined, options)}`;
}
