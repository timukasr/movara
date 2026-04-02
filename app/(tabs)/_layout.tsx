import { useAuth } from "@clerk/expo";
import { Redirect, Tabs, type Href } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            <TabIcon
              focused={focused}
              color={color}
              icon="▣"
              title="Dashboard"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="🏆"
              title="Challenges"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="👤"
              title="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  focused,
  color,
  icon,
  title,
}: {
  focused: boolean;
  color: string;
  icon: string;
  title: string;
}) {
  return (
    <View
      className={`items-center gap-0.5 rounded-full px-3 py-1.5 ${focused ? "bg-primary" : ""}`}
    >
      <Text style={{ color: focused ? "#fff" : color, fontSize: 20 }}>
        {icon}
      </Text>
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
