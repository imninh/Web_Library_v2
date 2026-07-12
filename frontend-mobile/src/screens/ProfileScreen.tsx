import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { profileApi } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";

type Mode = "login" | "register";

export function ProfileScreen() {
  const { user, login, register, logout, refresh } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cardId, setCardId] = useState("");
  const [email, setEmail] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setCardId(user.library_card_id ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const doAuth = async () => {
    if (!username.trim() || !password) return toast("Fill in username and password.", "err");
    if (mode === "register" && (username.length < 3 || password.length < 6)) return toast("Username ≥ 3, password ≥ 6.", "err");
    setBusy(true);
    try {
      if (mode === "register") await register({ username: username.trim(), password });
      else await login(username.trim(), password);
      toast(mode === "register" ? "Account created!" : "Signed in.");
      setUsername(""); setPassword("");
    } catch (e: any) { toast(e.message, "err"); }
    finally { setBusy(false); }
  };

  const saveProfile = async () => {
    if (!fullName.trim() || !cardId.trim() || !email.trim()) return toast("Fill in all three fields.", "err");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Invalid email.", "err");
    try {
      await profileApi.update({ full_name: fullName.trim(), library_card_id: cardId.trim(), email: email.trim() });
      await refresh();
      toast("Profile saved.");
    } catch (e: any) { toast(e.message, "err"); }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
          {!user ? (
            <>
              <Text style={styles.title}>{mode === "register" ? "Create account" : "Sign in"}</Text>
              <Text style={styles.sub}>{mode === "register" ? "Register for a free library card." : "Access your card and loans."}</Text>
              <TextInput placeholder="Username" placeholderTextColor="#8a978c" style={styles.inp} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
              <TextInput placeholder="Password" placeholderTextColor="#8a978c" style={styles.inp} value={password} onChangeText={setPassword} secureTextEntry />
              <Pressable style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={doAuth} disabled={busy}>
                {busy ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryBtnT}>{mode === "register" ? "Create account" : "Sign in"}</Text>}
              </Pressable>
              <View style={styles.switchWrap}>
                <Text style={{ fontSize: 13, color: "#6c7a71" }}>{mode === "register" ? "Have an account?" : "New here?"} </Text>
                <Pressable onPress={() => setMode(mode === "register" ? "login" : "register")}>
                  <Text style={styles.switchCta}>{mode === "register" ? "Sign in" : "Register"}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarT}>{user.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{user.username}</Text>
                  <Text style={styles.userRole}>{isAdmin ? "Librarian · Admin" : "Reader"}</Text>
                </View>
              </View>

              {isAdmin ? (
                <View style={styles.adminNote}>
                  <Text style={styles.adminNoteTitle}>Librarian account</Text>
                  <Text style={styles.adminNoteText}>
                    You manage the library from this app. Open the Loans tab to review and approve borrow requests. Reader profiles and borrowing are disabled for admin accounts.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.sectionHead}>
                    <Text style={styles.section}>Library profile</Text>
                    <View style={[styles.statusChip, { backgroundColor: user.account_status === "blocked" ? "#f6dada" : user.profile_complete ? "#d8ecdf" : colors.warnBg }]}>
                      <Text style={[styles.statusChipT, { color: user.account_status === "blocked" ? "#b23b3b" : user.profile_complete ? "#2f6e57" : colors.warn }]}>
                        {user.account_status === "blocked" ? "BLOCKED" : user.profile_complete ? "ACTIVE" : "INCOMPLETE"}
                      </Text>
                    </View>
                  </View>

                  <TextInput placeholder="Full name" placeholderTextColor="#8a978c" style={styles.inp} value={fullName} onChangeText={setFullName} />
                  <TextInput placeholder="Library card ID (e.g. LIB-2049)" placeholderTextColor="#8a978c" style={styles.inp} value={cardId} onChangeText={setCardId} autoCapitalize="characters" />
                  <TextInput placeholder="Email" placeholderTextColor="#8a978c" style={styles.inp} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                  <Pressable style={styles.primaryBtn} onPress={saveProfile}>
                    <Text style={styles.primaryBtnT}>Save profile</Text>
                  </Pressable>
                </>
              )}

              <Pressable style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutT}>Sign out</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  sub: { fontSize: 13.5, color: "#6c7a71", marginBottom: 20 },
  inp: { borderWidth: 1, borderColor: "rgba(27,58,49,.15)", borderRadius: 13, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14.5, backgroundColor: "#fff", marginBottom: 11, color: colors.ink },
  primaryBtn: { backgroundColor: colors.ink, borderRadius: 13, padding: 14, alignItems: "center", marginTop: 4 },
  primaryBtnT: { fontSize: 14.5, fontWeight: "700", color: colors.cream },
  switchWrap: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  switchCta: { fontSize: 13, fontWeight: "700", color: colors.ink, textDecorationLine: "underline" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  userAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#8c9a5a", alignItems: "center", justifyContent: "center" },
  userAvatarT: { fontSize: 22, fontWeight: "800", color: colors.cream },
  userName: { fontSize: 20, fontWeight: "800", color: colors.ink },
  userRole: { fontSize: 13, color: colors.inkSoft },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  section: { fontSize: 16, fontWeight: "700", color: colors.ink },
  statusChip: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 },
  statusChipT: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.4 },
  adminNote: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16 },
  adminNoteTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 6 },
  adminNoteText: { fontSize: 13.5, lineHeight: 20, color: colors.inkSoft },
  logoutBtn: { borderWidth: 1.5, borderColor: "rgba(198,69,69,.3)", borderRadius: 13, padding: 13, alignItems: "center", marginTop: 22 },
  logoutT: { fontSize: 14, fontWeight: "700", color: colors.danger },
});
