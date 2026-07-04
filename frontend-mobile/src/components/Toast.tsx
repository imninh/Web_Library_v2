import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme";

type ToastKind = "ok" | "err" | "info";
type Ctx = { toast: (msg: string, kind?: ToastKind) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; kind: ToastKind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((text: string, kind: ToastKind = "ok") => {
    setMsg({ text, kind });
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMsg(null);
      });
    }, 2600);
  }, [opacity]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {msg && (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity, backgroundColor: msg.kind === "err" ? colors.danger : msg.kind === "info" ? "#4a5a51" : colors.ink }]}>
          <Text style={styles.text}>{msg.text}</Text>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}
export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast requires ToastProvider");
  return c.toast;
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", bottom: 96, left: 24, right: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, zIndex: 999, alignSelf: "center", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  text: { color: colors.cream, fontSize: 13, fontWeight: "600", textAlign: "center" },
});
