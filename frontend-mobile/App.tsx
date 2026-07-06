import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "./src/auth";
import { ToastProvider } from "./src/components/Toast";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { CardScreen } from "./src/screens/CardScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ContactScreen } from "./src/screens/ContactScreen";
import { BookScreen } from "./src/screens/BookScreen";
import { colors } from "./src/theme";
import type { RootStackParamList, TabParamList } from "./src/types";

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: "#a8b0a4",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: colors.line, height: 66, paddingTop: 6, paddingBottom: 10 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "600" },
        tabBarIcon: ({ color, focused, size }) => {
          const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Home: ["home", "home-outline"],
            Search: ["search", "search-outline"],
            Card: ["card", "card-outline"],
            Contact: ["mail", "mail-outline"],
            Profile: ["person", "person-outline"],
          };
          const [filled, outline] = icons[route.name] ?? ["ellipse", "ellipse-outline"];
          return <Ionicons name={focused ? filled : outline} size={size ?? 24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Card" component={CardScreen} options={{ title: "My Card" }} />
      <Tab.Screen name="Contact" component={ContactScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <NavigationContainer>
              <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="Tabs" component={Tabs} />
                <RootStack.Screen name="Book" component={BookScreen} options={{ animation: "slide_from_right" }} />
              </RootStack.Navigator>
              <StatusBar style="auto" />
            </NavigationContainer>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
