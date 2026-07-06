import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { contactApi } from "../api";
import { useToast } from "../components/Toast";

const SUBJECTS = [
  { value: "general", label: "General question" },
  { value: "feedback", label: "Feedback" },
  { value: "partner", label: "Partnership" },
];

export function ContactScreen() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const n = name.trim(), e = email.trim(), m = message.trim();
    if (!n || !e || !m) return toast("Fill in your name, email and message.", "err");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return toast("Invalid email.", "err");
    setSending(true);
    try {
      await contactApi.send({ name: n, email: e, subject, message: m });
      toast("Thanks! We have received your message.");
      setName(""); setEmail(""); setMessage(""); setSubject("general");
    } catch (err: any) {
      toast(err.message || "Failed to send.", "err");
    } finally { setSending(false); }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>Get in touch</Text>
          <Text style={styles.title}>Contact us</Text>
          <Text style={styles.subtitle}>Questions, feedback or partnership ideas — we read every message.</Text>

          <View style={styles.info}>
            <View style={styles.infoRow}><Ionicons name="location-outline" size={18} color={colors.ink} /><Text style={styles.infoText}>C7 · HUST · 1 Dai Co Viet, Hanoi</Text></View>
            <View style={styles.infoRow}><Ionicons name="call-outline" size={18} color={colors.ink} /><Text style={styles.infoText}>(084) 24 1234 5678</Text></View>
            <View style={styles.infoRow}><Ionicons name="time-outline" size={18} color={colors.ink} /><Text style={styles.infoText}>Mon – Fri  08:00 – 20:00</Text></View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Full name</Text>
            <TextInput placeholder="Your name" placeholderTextColor="#8a978c" style={styles.inp} value={name} onChangeText={setName} />

            <Text style={styles.label}>Email</Text>
            <TextInput placeholder="you@example.com" placeholderTextColor="#8a978c" style={styles.inp} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />

            <Text style={styles.label}>Subject</Text>
            <View style={styles.chips}>
              {SUBJECTS.map((s) => {
                const active = subject === s.value;
                return (
                  <Pressable key={s.value} onPress={() => setSubject(s.value)} style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Message</Text>
            <TextInput placeholder="Write your message here..." placeholderTextColor="#8a978c" style={[styles.inp, styles.area]} value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlignVertical="top" />

            <Pressable onPress={submit} disabled={sending} style={({ pressed }) => [styles.btn, sending && { opacity: 0.6 }, pressed && !sending && { transform: [{ scale: 0.98 }] }]}>
              {sending ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.btnTxt}>Send message</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700" },
  title: { fontSize: 30, fontWeight: "800", color: colors.ink, marginTop: 6 },
  subtitle: { fontSize: 14, color: colors.inkSoft, marginTop: 8, lineHeight: 20 },
  info: { marginTop: 22, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { color: colors.ink, fontSize: 14 },
  card: { backgroundColor: colors.panel, borderRadius: 18, padding: 20, marginTop: 22, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  label: { fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  inp: { borderWidth: 1.5, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, backgroundColor: colors.bg },
  area: { minHeight: 110 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line },
  chipOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipTxt: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  chipTxtOn: { color: colors.ink },
  btn: { marginTop: 20, backgroundColor: colors.lime, borderRadius: 999, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  btnTxt: { color: colors.ink, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
