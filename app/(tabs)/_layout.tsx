import { useAuth } from "@clerk/expo";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Redirect, Tabs, type Href } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavBar, NavBarItem } from "@/lib/bottom-nav";
import { DashboardIcon, PersonIcon, TrophyIcon } from "@/lib/icons";

const TAB_CONFIG = [
  { name: "index", title: "Dashboard", Icon: DashboardIcon },
  { name: "challenges", title: "Challenges", Icon: TrophyIcon },
  { name: "profile", title: "Profile", Icon: PersonIcon },
] as const;

function AppTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <BottomNavBar>
      {TAB_CONFIG.map((tab, index) => {
        const active = state.index === index;
        return (
          <NavBarItem
            key={tab.name}
            active={active}
            title={tab.title}
            onPress={() => navigation.navigate(tab.name)}
          >
            <tab.Icon
              size={22}
              color={active ? "#fff" : "#dd9a97"}
              fill={active}
            />
          </NavBarItem>
        );
      })}
    </BottomNavBar>
  );
}

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
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#240304" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
