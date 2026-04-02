import { useAuth } from "@clerk/expo";
import { Redirect, Tabs, type Href } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DashboardIcon, PersonIcon, TrophyIcon } from "@/lib/icons";

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-medium text-on-surface-variant">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return <Redirect href={"/sign-in" as Href} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(73, 19, 20, 0.85)",
          borderTopWidth: 0,
          height: 80,
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarIconStyle: {
          flex: 1,
          justifyContent: "center",
        },
        sceneStyle: {
          backgroundColor: "#240304",
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#ff9066",
        tabBarInactiveTintColor: "#dd9a97",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} title="Dashboard">
              <DashboardIcon
                size={22}
                color={focused ? "#fff" : color}
                fill={focused}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} title="Challenges">
              <TrophyIcon
                size={22}
                color={focused ? "#fff" : color}
                fill={focused}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} title="Profile">
              <PersonIcon
                size={22}
                color={focused ? "#fff" : color}
                fill={focused}
              />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  focused,
  color,
  title,
  children,
}: {
  focused: boolean;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={`items-center gap-0.5 rounded-full px-3 py-1.5 ${focused ? "bg-primary" : ""}`}
    >
      {children}
      <Text
        style={{
          color: focused ? "#571a00" : color,
          fontSize: 10,
          fontWeight: focused ? "700" : "500",
        }}
      >
        {title}
      </Text>
    </View>
  );
}
