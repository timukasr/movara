import React from "react";
import { View } from "react-native";

export function Card({
  children,
  bg = "bg-surface-container-low",
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <View className={`relative overflow-hidden rounded-[2.5rem] p-8 ${bg}`}>
      {children}
    </View>
  );
}
