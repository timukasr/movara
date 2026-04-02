import React from "react";
import { Pressable, Text, View } from "react-native";

export function BottomNavBar({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-row items-center justify-around px-4"
      style={{
        backgroundColor: "rgba(73, 19, 20, 0.85)",
        height: 80,
      }}
    >
      {children}
    </View>
  );
}

export function NavBarItem({
  active,
  title,
  onPress,
  children,
}: {
  active: boolean;
  title: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center gap-0.5 rounded-full px-3 py-1.5 ${active ? "bg-primary" : ""}`}
    >
      {children}
      <Text
        style={{
          color: active ? "#571a00" : "#dd9a97",
          fontSize: 10,
          fontWeight: active ? "700" : "500",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
