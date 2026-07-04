import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from "react-native";
import { colors } from "../theme";

export function Sheet({ visible, onClose, title, subtitle, children }: { visible: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              {children}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(27,58,49,.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 34 },
  handle: { width: 40, height: 4, backgroundColor: "rgba(27,58,49,.2)", borderRadius: 4, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 19, fontWeight: "700", color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 12.5, color: "#6c7a71", marginBottom: 16 },
});
