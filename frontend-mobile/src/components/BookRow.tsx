import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, coverFor } from "../theme";
import type { Book } from "../types";

export function BookRow({ book, onPress }: { book: Book; onPress: () => void }) {
  const c = coverFor(book.id);
  const inStock = (book.stock || 0) > 0;
  const rating = book.rating && book.rating > 0 ? book.rating.toFixed(1) : "New";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
      <View style={[styles.cover, { backgroundColor: c.bg }]}>
        <Text numberOfLines={3} style={[styles.coverTitle, { color: c.fg }]}>{book.title}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.title}>{book.title}</Text>
        <Text numberOfLines={1} style={styles.author}>{book.author}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.pill, { backgroundColor: inStock ? colors.successBg : "#f6ead9" }]}>
            <Text style={[styles.pillText, { color: inStock ? colors.success : "#c0803a" }]}>{inStock ? `${book.stock} available` : "On loan"}</Text>
          </View>
          <Text style={styles.rate}>★ {rating}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#c3ccb8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 12 },
  cover: { width: 56, height: 74, borderRadius: 11, padding: 7, justifyContent: "flex-end" },
  coverTitle: { fontSize: 9, fontWeight: "700", lineHeight: 11 },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink },
  author: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "700" },
  rate: { fontSize: 11, color: colors.inkSoft },
});
