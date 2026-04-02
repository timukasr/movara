import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { Card } from "@/lib/card";
import { BackIcon } from "@/lib/icons";

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

export default function NewActivityScreen() {
  const router = useRouter();
  const createActivity = useMutation(api.activities.create);
  const [name, setName] = React.useState("");
  const [sportType, setSportType] = React.useState("Run");
  const [distanceKm, setDistanceKm] = React.useState("");
  const [durationMin, setDurationMin] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (submitting) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Give your activity a name.");
      return;
    }

    const distance = Number(distanceKm) * 1000;
    const movingTime = Number(durationMin) * 60;

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
      await createActivity({
        name: trimmedName,
        sportType,
        distance,
        movingTime,
      });
      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create activity.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-4 px-6 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <BackIcon size={24} color="#ff9066" />
        </Pressable>
        <Text className="text-lg font-black uppercase tracking-widest text-primary">
          Log Activity
        </Text>
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
                placeholder="Morning run"
                placeholderTextColor="#b69290"
                value={name}
                onChangeText={setName}
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
                    onPress={() => setSportType(type)}
                    className={`rounded-full px-4 py-2 ${
                      sportType === type
                        ? "bg-primary"
                        : "border border-outline-variant/30 bg-surface-container-high"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        sportType === type
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
                placeholder="5.0"
                placeholderTextColor="#b69290"
                value={distanceKm}
                onChangeText={setDistanceKm}
                keyboardType="decimal-pad"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                Duration (minutes)
              </Text>
              <TextInput
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
                placeholder="30"
                placeholderTextColor="#b69290"
                value={durationMin}
                onChangeText={setDurationMin}
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
          onPress={handleCreate}
        >
          <Text className="text-base font-extrabold text-[#571a00]">
            {submitting ? "Saving..." : "Save activity"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
