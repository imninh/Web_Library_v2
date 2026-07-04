import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, statusMeta } from "../theme";
import { loansApi } from "../api";
import { useAuth } from "../auth";
import type { Loan, TabParamList } from "../types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export function CardScreen({ navigation }: { navigation: BottomTabNavigationProp<TabParamList, "Card"> }) {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoans([]); return; }
    const r = await loansApi.mine();
    setLoans(r.items);
  }, [user]);

  useEffect(() => {
    (async () => {
      try { await load(); } finally { setLoading(false); }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const active = loans.filter(l => ["pending","borrowing","overdue"].includes(l.status)).length;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <Text style={styles.title}>My card</Text>

        {!user ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}><Ionicons name="card" size={26} color={colors.ink} /></View>
            <Text style={styles.emptyTitle}>Get your library card</Text>
            <Text style={styles.emptyText}>Sign in to reserve books and track your loans.</Text>
            <Pressable onPress={() => navigation.navigate("Profile")} style={styles.signInBtn}>
              <Text style={styles.signInBtnT}>Sign in</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>LIBRUMI LIBRARY CARD</Text>
              <Text style={styles.cardName}>{user.full_name || user.username}</Text>
              <Text style={styles.cardId}>{user.library_card_id || "Not set"}</Text>
              <View style={styles.cardStats}>
                <View>
                  <Text style={styles.cardStatNum}>{active}</Text>
                  <Text style={styles.cardStatLabel}>ACTIVE</Text>
                </View>
                <View>
                  <Text style={styles.cardStatNum}>{loans.length}</Text>
                  <Text style={styles.cardStatLabel}>ALL-TIME</Text>
                </View>
                <View style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
                  <Text style={[styles.cardStatus, { backgroundColor: user.account_status === "blocked" ? "rgba(198,69,69,.4)" : "rgba(207,224,33,.18)", color: user.account_status === "blocked" ? "#f6dada" : colors.lime }]}>
                    {user.account_status === "blocked" ? "BLOCKED" : (user.profile_complete ? "ACTIVE" : "INCOMPLETE")}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.section}>My loans</Text>
            {loading ? <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} /> : loans.length === 0 ? (
              <View style={styles.emptyLoansBox}>
                <Text style={{ color: "#6c7a71", textAlign: "center" }}>No loans yet.</Text>
                <Pressable onPress={() => navigation.navigate("Search")}><Text style={styles.emptyLoansCta}>Find a book →</Text></Pressable>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {loans.map(l => {
                  const m = statusMeta[l.status] ?? statusMeta.pending;
                  return (
                    <View key={l.id} style={styles.loanCard}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={styles.loanTitle}>{l.book_title ?? "Book #" + l.book_id}</Text>
                        <Text style={styles.loanMeta}>Return by {l.due_date ?? "—"}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: m.bg }]}>
                        <Text style={[styles.statusText, { color: m.color }]}>{m.label.toUpperCase()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, marginBottom: 16 },
  card: { backgroundColor: colors.forest, borderRadius: 22, padding: 22, marginBottom: 20 },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.5, color: "rgba(251,252,245,.6)", marginBottom: 14 },
  cardName: { fontSize: 20, fontWeight: "800", color: colors.cream, marginBottom: 4 },
  cardId: { fontSize: 13, color: "rgba(251,252,245,.75)", letterSpacing: 0.5 },
  cardStats: { flexDirection: "row", gap: 20, marginTop: 18, alignItems: "center" },
  cardStatNum: { fontSize: 20, fontWeight: "800", color: colors.lime },
  cardStatLabel: { fontSize: 10.5, color: "rgba(251,252,245,.65)", letterSpacing: 0.6 },
  cardStatus: { fontSize: 10.5, fontWeight: "700", paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, overflow: "hidden", letterSpacing: 0.5 },
  section: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 12 },
  loanCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  loanTitle: { fontSize: 14.5, fontWeight: "700", color: colors.ink },
  loanMeta: { fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.4 },
  emptyBox: { backgroundColor: colors.panelSoft, borderRadius: 20, padding: 30, alignItems: "center" },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, marginBottom: 6 },
  emptyText: { fontSize: 13.5, color: "#6c7a71", lineHeight: 20, marginBottom: 18, textAlign: "center" },
  signInBtn: { backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 26, paddingVertical: 13 },
  signInBtnT: { fontSize: 14, fontWeight: "700", color: colors.cream },
  emptyLoansBox: { backgroundColor: colors.panelSoft, borderRadius: 16, padding: 26, alignItems: "center", gap: 10 },
  emptyLoansCta: { fontSize: 13, fontWeight: "700", color: colors.ink, textDecorationLine: "underline" },
});
