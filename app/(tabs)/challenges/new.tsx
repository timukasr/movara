import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";

export default function NewChallengeScreen() {
  const router = useRouter();
  const createChallenge = useMutation(api.challenges.create);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const challengeId = await createChallenge({ name });
      router.replace({
        pathname: "/challenges/[challengeId]",
        params: { challengeId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create challenge.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-6 px-6 pb-10 pt-8">
        <Pressable
          className="self-start rounded-full border border-outline-variant/30 px-4 py-2 active:opacity-[0.88]"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-extrabold text-on-surface">Back</Text>
        </Pressable>

        <View className="gap-3">
          <Text className="text-[13px] font-bold uppercase tracking-[2px] text-primary">
            movara
          </Text>
          <Text className="text-[34px] font-extrabold leading-10 text-on-surface">
            Create challenge
          </Text>
          <Text className="text-base leading-6 text-on-surface-variant">
            Start with a name. You can add members right after this step.
          </Text>
        </View>

        <View className="gap-3 rounded-[22px] border border-outline-variant/30 bg-surface-container p-[18px]">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            Challenge name
          </Text>
          <TextInput
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
            placeholder="Morning Miles"
            placeholderTextColor="#b69290"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          {errorMessage ? (
            <Text className="text-sm leading-5 text-error">{errorMessage}</Text>
          ) : null}
        </View>

        <Pressable
          className={`items-center rounded-full bg-primary px-5 py-4 ${
            submitting ? "opacity-55" : "active:opacity-[0.88]"
          }`}
          disabled={submitting}
          onPress={handleCreate}
        >
          <Text className="text-base font-extrabold text-[#571a00]">
            {submitting ? "Creating..." : "Create challenge"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
