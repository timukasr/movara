import React from "react";
import { View } from "react-native";

export function Card({
  children,
  bg = "bg-surface-container-low",
  compact,
}: {
  children: React.ReactNode;
  bg?: string;
  compact?: boolean;
}) {
  return (
    <View
      className={`relative overflow-hidden ${
        compact
          ? "rounded-[22px] border border-outline-variant/30 p-[18px]"
          : "rounded-[2.5rem] p-8"
      } ${bg}`}
    >
      {children}
    </View>
  );
}
