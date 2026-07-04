import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { booksApi } from "../api";
import { BookRow } from "../components/BookRow";
import { Chip } from "../components/Chip";
import type { Book, TabParamList, RootStackParamList } from "../types";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Search">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function SearchScreen({ navigation }: { navigation: Nav }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [items, setItems] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try { setCategories(await booksApi.categories()); } catch {}
    })();
  }, []);

  const doSearch = useCallback(async (search: string, category: string) => {
    setLoading(true);
    try {
      const r = await booksApi.list({ search: search || undefined, category: category !== "All" ? category : undefined, limit: 40 });
      setItems(r.items);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q, cat), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, cat, doSearch]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.head}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8a978c" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search title or author…"
            placeholderTextColor="#8a978c"
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 22 }} style={{ marginTop: 14 }}>
          {categories.map(c => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 24, gap: 12 }}>
        {loading ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <Text style={{ textAlign: "center", color: colors.inkSoft, marginTop: 40, fontSize: 14 }}>No titles found.</Text>
        ) : (
          items.map(b => <BookRow key={b.id} book={b} onPress={() => navigation.navigate("Book", { id: b.id })} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingBottom: 18 },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, marginBottom: 14 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(27,58,49,.1)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  input: { flex: 1, fontSize: 14.5, color: colors.ink, paddingVertical: 12 },
});
