import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999, backgroundColor: "#eceae2" },
  active: { backgroundColor: colors.lime },
  text: { fontSize: 12.5, fontWeight: "600", color: colors.ink },
  textActive: { color: colors.ink },
});
