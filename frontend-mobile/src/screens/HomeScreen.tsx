import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, RefreshControl, ActivityIndicator, Image, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, coverFor } from "../theme";
import { booksApi } from "../api";
import { useAuth } from "../auth";
import { BookRow } from "../components/BookRow";
import { Chip } from "../components/Chip";
import type { Book, TabParamList, RootStackParamList } from "../types";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Book[]>([]);
  const [available, setAvailable] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [f, a, cs] = await Promise.all([
      booksApi.list({ featured: 1, limit: 8 }),
      booksApi.list({ limit: 5 }),
      booksApi.categories(),
    ]);
    setFeatured(f.items);
    setAvailable(a.items.filter(b => (b.stock || 0) > 0).slice(0, 5));
    setCategories(cs);
  }, []);

  useEffect(() => {
    (async () => {
      try { await load(); } finally { setLoading(false); }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const name = user?.full_name ? user.full_name.split(" ")[0] : (user?.username ?? "Reader");
  const initial = (user?.username ?? "G").charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <SafeAreaView edges={["top"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.greetingName}>{name}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate("Profile")} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.searchBar} onPress={() => navigation.navigate("Search")}>
            <Ionicons name="search" size={18} color="#8a978c" />
            <Text style={styles.searchText}>Search title or author…</Text>
          </Pressable>
        </SafeAreaView>

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator color={colors.ink} /></View>
        ) : (
          <>
            <View style={{ paddingTop: 24 }}>
              <Text style={styles.sectionTitle}>Featured this week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 14, paddingBottom: 8 }} style={{ marginTop: 14 }}>
                {featured.length === 0 ? (
                  <Text style={{ color: colors.inkSoft, fontSize: 13 }}>No featured books yet.</Text>
                ) : featured.map(b => {
                  const c = coverFor(b.id);
                  const Wrap: any = b.image ? ImageBackground : View;
                  const wrapProps = b.image
                    ? { source: { uri: b.image }, imageStyle: { borderRadius: 22 }, resizeMode: "cover" as const }
                    : { style: { backgroundColor: c.bg } };
                  return (
                    <Pressable key={b.id} onPress={() => navigation.navigate("Book", { id: b.id })} style={[styles.featCard, !b.image && { backgroundColor: c.bg }]}>
                      <Wrap {...wrapProps} style={[styles.featInner, !b.image && { backgroundColor: c.bg }]}>
                        {b.image && <View style={styles.featScrim} />}
                        <View style={styles.featTop}>
                          <Text style={[styles.featCat, { color: b.image ? "rgba(255,255,255,.9)" : c.meta }]}>{b.category.toUpperCase()}</Text>
                          <View style={styles.featBadge}><Text style={styles.featBadgeText}>FEATURED</Text></View>
                        </View>
                        <View>
                          <Text numberOfLines={3} style={[styles.featTitle, { color: b.image ? "#fff" : c.fg }]}>{b.title}</Text>
                          <Text numberOfLines={1} style={[styles.featAuthor, { color: b.image ? "rgba(255,255,255,.85)" : c.meta }]}>{b.author}</Text>
                        </View>
                      </Wrap>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
              <Text style={styles.sectionTitle}>Browse by category</Text>
              <View style={styles.chips}>
                {categories.slice(0, 8).map(c => (
                  <Chip key={c} label={c} onPress={() => navigation.navigate("Search")} />
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
              <Text style={styles.sectionTitle}>Available now</Text>
              <View style={{ gap: 12, marginTop: 14 }}>
                {available.map(b => (
                  <BookRow key={b.id} book={b} onPress={() => navigation.navigate("Book", { id: b.id })} />
                ))}
                {available.length === 0 && <Text style={{ color: colors.inkSoft }}>No books available right now.</Text>}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.olive1, paddingHorizontal: 22, paddingBottom: 26, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  greeting: { fontSize: 13, color: "rgba(251,252,245,.8)", fontWeight: "600" },
  greetingName: { fontSize: 22, fontWeight: "800", color: colors.cream, letterSpacing: -0.2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(251,252,245,.18)", borderWidth: 1.5, borderColor: "rgba(255,255,255,.3)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.cream, fontWeight: "800", fontSize: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.cream, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  searchText: { color: "#8a978c", fontSize: 14.5 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.ink, paddingHorizontal: 22 },
  featCard: { width: 210, height: 250, borderRadius: 22, overflow: "hidden" },
  featInner: { flex: 1, padding: 20, justifyContent: "space-between" },
  featScrim: { position: "absolute", left: 0, right: 0, bottom: 0, top: "40%", backgroundColor: "rgba(0,0,0,.35)" },
  featTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  featCat: { fontSize: 9.5, fontWeight: "700", letterSpacing: 1 },
  featBadge: { backgroundColor: colors.lime, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  featBadgeText: { fontSize: 9, fontWeight: "800", color: colors.ink, letterSpacing: 0.8 },
  featTitle: { fontSize: 19, fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  featAuthor: { fontSize: 12, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 14 },
});
