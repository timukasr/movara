import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import * as React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";

export default function NewChallengeScreen() {
  const router = useRouter();
  const createChallenge = useMutation(api.challenges.create);
  const [name, setName] = React.useState("");
  const [goalXp, setGoalXp] = React.useState("100");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [activePicker, setActivePicker] = React.useState<
    "start" | "end" | null
  >(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const startDateValue = React.useMemo(
    () => parsePickerDate(startDate) ?? new Date(),
    [startDate],
  );
  const endDateValue = React.useMemo(() => {
    return parsePickerDate(endDate) ?? startDateValue;
  }, [endDate, startDateValue]);

  const handleCreate = async () => {
    if (submitting) {
      return;
    }

    const parsedGoalXp = Number(goalXp.trim());
    const parsedStartAt = parseDateInput(startDate, "start");
    const parsedEndAt = parseDateInput(endDate, "end");

    if (!Number.isFinite(parsedGoalXp) || parsedGoalXp <= 0) {
      setErrorMessage("Enter a goal XP greater than 0.");
      return;
    }

    if (parsedStartAt === null || parsedEndAt === null) {
      setErrorMessage("Enter challenge dates as YYYY-MM-DD.");
      return;
    }

    if (parsedEndAt < parsedStartAt) {
      setErrorMessage("End date must be on or after the start date.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const challengeId = await createChallenge({
        name,
        goalXp: parsedGoalXp,
        startAt: parsedStartAt,
        endAt: parsedEndAt,
      });
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

  const handleDateChange = React.useCallback(
    (field: "start" | "end") =>
      (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS !== "android") {
          setActivePicker(null);
        }

        if (event.type === "dismissed" || !selectedDate) {
          return;
        }

        const nextValue = formatDateInputValue(selectedDate);

        if (field === "start") {
          setStartDate(nextValue);
          if (endDate && parseDateInput(endDate, "end") === null) {
            setEndDate("");
          }
          return;
        }

        setEndDate(nextValue);
      },
    [endDate],
  );

  const openPicker = (field: "start" | "end") => {
    setErrorMessage(null);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        display: "calendar",
        value: field === "start" ? startDateValue : endDateValue,
        minimumDate: field === "end" ? startDateValue : undefined,
        onChange: handleDateChange(field),
      });
      return;
    }

    setActivePicker(field);
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
            Set the goal and date range, then add members right after this step.
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
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            Goal XP
          </Text>
          <TextInput
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-base text-on-surface"
            placeholder="100"
            placeholderTextColor="#b69290"
            value={goalXp}
            onChangeText={setGoalXp}
            keyboardType="numeric"
            returnKeyType="next"
          />
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            Start date
          </Text>
          {Platform.OS === "web" ? (
            <WebDateInput value={startDate} onChange={setStartDate} />
          ) : (
            <Pressable
              className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 active:opacity-[0.88]"
              onPress={() => openPicker("start")}
            >
              <Text
                className={
                  startDate
                    ? "text-base text-on-surface"
                    : "text-base text-on-surface-variant"
                }
              >
                {startDate || "Pick start date"}
              </Text>
            </Pressable>
          )}
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            End date
          </Text>
          {Platform.OS === "web" ? (
            <WebDateInput
              value={endDate}
              min={startDate || undefined}
              onChange={setEndDate}
            />
          ) : (
            <Pressable
              className="rounded-2xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 active:opacity-[0.88]"
              onPress={() => openPicker("end")}
            >
              <Text
                className={
                  endDate
                    ? "text-base text-on-surface"
                    : "text-base text-on-surface-variant"
                }
              >
                {endDate || "Pick end date"}
              </Text>
            </Pressable>
          )}
          {Platform.OS !== "android" && activePicker ? (
            <View className="gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-high p-3">
              <DateTimePicker
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={
                  activePicker === "end" ? startDateValue : undefined
                }
                mode="date"
                onChange={handleDateChange(activePicker)}
                value={activePicker === "start" ? startDateValue : endDateValue}
              />
              <Pressable
                className="self-end rounded-full border border-outline-variant/30 px-4 py-2 active:opacity-[0.88]"
                onPress={() => setActivePicker(null)}
              >
                <Text className="text-sm font-extrabold text-on-surface">
                  Done
                </Text>
              </Pressable>
            </View>
          ) : null}
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

function parseDateInput(value: string, boundary: "start" | "end") {
  const normalizedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const suffix = boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
  const timestamp = Date.parse(`${normalizedValue}${suffix}`);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function parsePickerDate(value: string) {
  const normalizedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const parsed = new Date(`${normalizedValue}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function WebDateInput(props: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleOpenPicker = () => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <button
      style={webDateInputShellStyle}
      type="button"
      onClick={handleOpenPicker}
    >
      <span
        style={
          props.value ? webDateInputValueStyle : webDateInputPlaceholderStyle
        }
      >
        {props.value ? formatWebDateDisplay(props.value) : "Pick a date"}
      </span>
      <span style={webDateInputBadgeStyle}>CAL</span>
      <input
        min={props.min}
        onChange={(event) => props.onChange(event.currentTarget.value)}
        ref={inputRef}
        style={webDateInputStyle}
        type="date"
        value={props.value}
      />
    </button>
  );
}

const webDateInputShellStyle: React.CSSProperties = {
  alignItems: "center",
  background:
    "linear-gradient(180deg, rgba(49, 29, 30, 0.96), rgba(37, 21, 22, 0.96))",
  border: "1px solid rgba(204, 175, 173, 0.26)",
  borderRadius: 16,
  cursor: "pointer",
  display: "flex",
  gap: 12,
  justifyContent: "space-between",
  minHeight: 52,
  outline: "none",
  overflow: "hidden",
  padding: "12px 14px 12px 16px",
  position: "relative",
  textAlign: "left",
  width: "100%",
};

const webDateInputStyle: React.CSSProperties = {
  height: 0,
  opacity: 0.0001,
  pointerEvents: "none",
  position: "absolute",
  width: 0,
};

const webDateInputValueStyle: React.CSSProperties = {
  color: "#f6dad7",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 600,
  lineHeight: "24px",
};

const webDateInputPlaceholderStyle: React.CSSProperties = {
  color: "#b69290",
  fontFamily: "inherit",
  fontSize: 16,
  lineHeight: "24px",
};

const webDateInputBadgeStyle: React.CSSProperties = {
  backgroundColor: "rgba(230, 180, 95, 0.14)",
  border: "1px solid rgba(230, 180, 95, 0.24)",
  borderRadius: 999,
  color: "#f2bf74",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.12em",
  padding: "8px 10px",
};

function formatWebDateDisplay(value: string) {
  const parsed = parsePickerDate(value);

  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
