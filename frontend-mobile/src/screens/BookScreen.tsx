import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, coverFor } from "../theme";
import { booksApi, commentsApi, loansApi } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";
import { Sheet } from "../components/Sheet";
import type { Book, Comment, RootStackParamList } from "../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Book">;

export function BookScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [rating, setRating] = useState(0);
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rContent, setRContent] = useState("");

  const load = useCallback(async () => {
    const [b, cs] = await Promise.all([booksApi.detail(id), commentsApi.ofBook(id)]);
    setBook(b);
    setComments(cs.items);
  }, [id]);

  useEffect(() => {
    (async () => {
      try { await load(); } finally { setLoading(false); }
    })();
  }, [load]);

  const submitReview = async () => {
    if (!rName.trim() || !rEmail.trim() || !rContent.trim()) return toast("Fill in all fields.", "err");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rEmail)) return toast("Invalid email.", "err");
    if (rating < 1) return toast("Pick a star rating.", "err");
    if (rContent.length < 100) return toast(`Min 100 chars (${rContent.length}/100).`, "err");
    try {
      await commentsApi.create(id, { name: rName.trim(), email: rEmail.trim(), content: rContent.trim(), rating });
      setReviewOpen(false);
      setRating(0); setRName(""); setREmail(""); setRContent("");
      await load();
      toast("Thanks! Your review is public.");
    } catch (e: any) { toast(e.message, "err"); }
  };

  const confirmBorrow = async () => {
    if (!dueDate || dueDate <= new Date().toISOString().slice(0, 10)) return toast("Pick a date after today.", "err");
    try {
      await loansApi.create([{ id }], dueDate);
      setBorrowOpen(false);
      toast("Request sent! Check My Card.");
      await refresh();
    } catch (e: any) { toast(e.message, "err"); }
  };

  const tapBorrow = () => {
    if (!user) return navigation.navigate("Tabs", { screen: "Profile" });
    if (!user.profile_complete) return toast("Complete your profile first.", "err");
    if (user.account_status === "blocked") return toast("Account locked — return an overdue book.", "err");
    if (!book || book.stock <= 0) return toast("All copies are on loan.", "err");
    setBorrowOpen(true);
  };

  if (loading || !book) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}><ActivityIndicator color={colors.ink} /></View>;
  }
  const c = coverFor(book.id);
  const inStock = (book.stock || 0) > 0;
  const rateText = book.rating && book.rating > 0 ? book.rating.toFixed(1) : "New";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <SafeAreaView edges={["top"]} style={[styles.header, { backgroundColor: c.bg }]}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <Text style={[styles.cat, { color: c.meta }]}>{book.category.toUpperCase()}</Text>
          </View>
          <View style={styles.coverBig}>
            <View style={[styles.coverInner, { backgroundColor: "rgba(255,255,255,.14)", borderColor: "rgba(255,255,255,.25)" }]}>
              <Text style={[styles.coverTitle, { color: c.fg }]} numberOfLines={4}>{book.title}</Text>
              <Text style={[styles.coverAuthor, { color: c.meta }]} numberOfLines={1}>{book.author}</Text>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by <Text style={{ color: colors.ink, fontWeight: "700" }}>{book.author}</Text></Text>
          <View style={styles.pills}>
            <View style={[styles.pill, { borderColor: inStock ? colors.success : "#c0803a", borderWidth: 1.5 }]}><Text style={[styles.pillT, { color: inStock ? colors.success : "#c0803a" }]}>{inStock ? `${book.stock} available` : "On loan"}</Text></View>
            <View style={[styles.pill, styles.pillMuted]}><Text style={styles.pillMutedT}>★ {rateText}</Text></View>
            {book.year && <View style={[styles.pill, styles.pillMuted]}><Text style={styles.pillMutedT}>{book.year}</Text></View>}
          </View>
          {book.description && <Text style={styles.desc}>{book.description}</Text>}

          <View style={styles.reviewsHead}>
            <Text style={styles.reviewsTitle}>Reviews</Text>
            <Text style={styles.reviewsMeta}>{comments.length} review{comments.length !== 1 ? "s" : ""}</Text>
          </View>
          <View style={{ gap: 10, marginBottom: 16 }}>
            {comments.length === 0 && <Text style={{ fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 }}>Be the first to review this title.</Text>}
            {comments.map(cm => (
              <View key={cm.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewName}>{cm.name}</Text>
                  <Text style={styles.reviewStars}>{"★".repeat(cm.rating) + "☆".repeat(5 - cm.rating)}</Text>
                </View>
                <Text style={styles.reviewContent}>{cm.content}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={() => setReviewOpen(true)} style={styles.reviewBtn}>
            <Text style={styles.reviewBtnT}>Write a review</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.bar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barNote}>{inStock ? "Availability" : "Waiting list"}</Text>
          <Text style={styles.barTitle}>{inStock ? `${book.stock} copies free` : "All on loan"}</Text>
        </View>
        <Pressable onPress={tapBorrow} style={styles.barBtn}>
          <Text style={styles.barBtnT}>{!user ? "Sign in" : (!inStock ? "On loan" : "Borrow")}</Text>
        </Pressable>
      </SafeAreaView>

      <Sheet visible={reviewOpen} onClose={() => setReviewOpen(false)} title="Write a review" subtitle="Minimum 100 characters. Appears publicly right away.">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TextInput placeholder="Your name" placeholderTextColor="#8a978c" value={rName} onChangeText={setRName} style={styles.inp} />
          <TextInput placeholder="Email" placeholderTextColor="#8a978c" value={rEmail} onChangeText={setREmail} style={styles.inp} autoCapitalize="none" keyboardType="email-address" />
          <View style={styles.starsRow}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>Rating</Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {[1,2,3,4,5].map(i => (
                <Pressable key={i} onPress={() => setRating(i)}>
                  <Text style={{ fontSize: 26, color: i <= rating ? "#cfa000" : "#d6d3c8" }}>★</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <TextInput placeholder="What did you think? (min 100 chars)" placeholderTextColor="#8a978c" value={rContent} onChangeText={setRContent} multiline style={[styles.inp, { minHeight: 90, textAlignVertical: "top" }]} />
          <Pressable style={styles.primaryBtn} onPress={submitReview}><Text style={styles.primaryBtnT}>Post review</Text></Pressable>
        </KeyboardAvoidingView>
      </Sheet>

      <Sheet visible={borrowOpen} onClose={() => setBorrowOpen(false)} title={`Reserve "${book.title}"`} subtitle="Pick a return date. A librarian approves your request.">
        <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>Return by (YYYY-MM-DD)</Text>
        <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-08-01" placeholderTextColor="#8a978c" style={styles.inp} autoCapitalize="none" />
        <Pressable style={[styles.primaryBtn, { backgroundColor: colors.lime }]} onPress={confirmBorrow}>
          <Text style={[styles.primaryBtnT, { color: colors.ink }]}>Send borrow request</Text>
        </Pressable>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingBottom: 34 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,.9)", alignItems: "center", justifyContent: "center" },
  cat: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  coverBig: { alignItems: "center", paddingTop: 22 },
  coverInner: { width: 150, height: 210, borderRadius: 16, borderWidth: 1, padding: 18, justifyContent: "flex-end" },
  coverTitle: { fontSize: 19, fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  coverAuthor: { fontSize: 11.5, fontWeight: "600" },
  body: { padding: 22, marginTop: -16, backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  title: { fontSize: 23, fontWeight: "800", color: colors.ink, marginTop: 6, marginBottom: 4 },
  author: { fontSize: 14, color: "#4a5a51", marginBottom: 14 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fff" },
  pillT: { fontSize: 12, fontWeight: "700" },
  pillMuted: { backgroundColor: "#eceae2" },
  pillMutedT: { fontSize: 12, fontWeight: "600", color: "#5c6b63" },
  desc: { fontSize: 14.5, lineHeight: 22, color: "#3f4f47", marginBottom: 20 },
  reviewsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reviewsTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  reviewsMeta: { fontSize: 12.5, color: colors.inkSoft },
  reviewCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  reviewName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
  reviewStars: { color: "#cfa000", fontSize: 12, letterSpacing: 1 },
  reviewContent: { fontSize: 13, lineHeight: 20, color: "#4a5a51" },
  reviewBtn: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "rgba(27,58,49,.15)", borderRadius: 14, padding: 13, alignItems: "center" },
  reviewBtnT: { fontSize: 14, fontWeight: "700", color: colors.ink },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 12 },
  barNote: { fontSize: 11, color: colors.inkSoft },
  barTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  barBtn: { backgroundColor: colors.lime, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22 },
  barBtnT: { fontSize: 14.5, fontWeight: "700", color: colors.ink },
  inp: { borderWidth: 1, borderColor: "rgba(27,58,49,.15)", borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: "#fff", color: colors.ink, marginBottom: 10 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  primaryBtn: { backgroundColor: colors.ink, borderRadius: 13, padding: 14, alignItems: "center", marginTop: 4 },
  primaryBtnT: { fontSize: 14.5, fontWeight: "700", color: colors.cream },
});
