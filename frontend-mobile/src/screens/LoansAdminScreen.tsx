import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, statusMeta } from "../theme";
import { loansApi } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";
import type { Loan } from "../types";

export function LoansAdminScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (user?.role !== "admin") { setLoans([]); return; }
    const r = await loansApi.adminList();
    setLoans(r.items);
  }, [user]);

  useEffect(() => {
    (async () => {
      try { await load(); } catch { } finally { setLoading(false); }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } catch { } finally { setRefreshing(false); }
  }, [load]);

  const setStatus = async (id: number, status: "approved" | "rejected" | "returned") => {
    try {
      await loansApi.setStatus(id, status);
      await load();
      toast(status === "approved" ? "Loan approved." : status === "rejected" ? "Request rejected." : "Book returned.");
    } catch (e: any) { toast(e.message, "err"); }
  };

  const pending = loans.filter(l => l.status === "pending").length;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <View style={styles.head}>
          <Text style={styles.title}>Loan requests</Text>
          <View style={[styles.chip, { backgroundColor: colors.warnBg }]}>
            <Text style={[styles.chipT, { color: colors.warn }]}>{pending} PENDING</Text>
          </View>
        </View>
        <Text style={styles.sub}>Review and manage every borrow request in the library.</Text>

        {loading ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
        ) : loans.length === 0 ? (
          <Text style={styles.empty}>No loan requests yet.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {loans.map(l => {
              const m = statusMeta[l.status] ?? statusMeta.pending;
              return (
                <View key={l.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text numberOfLines={2} style={styles.bookTitle}>{l.book_title ?? "Book #" + l.book_id}</Text>
                    <View style={[styles.chip, { backgroundColor: m.bg }]}>
                      <Text style={[styles.chipT, { color: m.color }]}>{m.label.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <Meta label="Borrower" value={l.borrower_name || "—"} />
                    <Meta label="Card ID" value={l.library_card_id || "—"} />
                    <Meta label="Due date" value={l.due_date ?? "—"} />
                    <Meta label="Requested" value={l.created_at ? l.created_at.slice(0, 10) : "—"} />
                  </View>

                  {l.status === "pending" && (
                    <View style={styles.actions}>
                      <Pressable style={[styles.btn, { backgroundColor: colors.lime }]} onPress={() => setStatus(l.id, "approved")}>
                        <Text style={[styles.btnT, { color: colors.ink }]}>Approve</Text>
                      </Pressable>
                      <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => setStatus(l.id, "rejected")}>
                        <Text style={[styles.btnT, { color: colors.danger }]}>Reject</Text>
                      </Pressable>
                    </View>
                  )}
                  {(l.status === "borrowing" || l.status === "overdue") && (
                    <View style={styles.actions}>
                      <Pressable style={[styles.btn, { backgroundColor: "#eceae2" }]} onPress={() => setStatus(l.id, "returned")}>
                        <Text style={[styles.btnT, { color: colors.ink }]}>Mark as returned</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLbl}>{label}</Text>
      <Text style={styles.metaVal} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  sub: { fontSize: 13.5, color: "#6c7a71", marginTop: 4, marginBottom: 20 },
  empty: { color: colors.inkSoft, fontSize: 13, textAlign: "center", padding: 30 },
  chip: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 },
  chipT: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.4 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  bookTitle: { flex: 1, fontSize: 15.5, fontWeight: "700", color: colors.ink },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  metaItem: { width: "50%", marginBottom: 10 },
  metaLbl: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.4, color: colors.inkSoft, textTransform: "uppercase" },
  metaVal: { fontSize: 13.5, color: colors.ink, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  btn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 11, borderRadius: 10 },
  btnOutline: { borderWidth: 1, borderColor: "rgba(198,69,69,.3)" },
  btnT: { fontSize: 13, fontWeight: "700" },
});
