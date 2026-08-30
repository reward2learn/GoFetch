import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppText, Button, Card, colors, radius, spacing, type } from "@/src/components/ui";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

const STEPS = [
  { icon: "card-outline", title: "Government ID", text: "Passport or national ID card" },
  { icon: "person-circle-outline", title: "Selfie match", text: "A quick liveness check" },
  { icon: "home-outline", title: "Proof of address", text: "Recent utility bill or statement" },
];

export default function Kyc() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const [phase, setPhase] = useState<"intro" | "verifying" | "done">("intro");

  const verify = async () => {
    setPhase("verifying");
    try {
      await new Promise((r) => setTimeout(r, 1400));
      await api.post("/users/kyc");
      await refresh();
      setPhase("done");
    } catch {
      setPhase("intro");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="kyc-close" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Identity verification</AppText>
        <View style={{ width: 26 }} />
      </View>

      {phase === "done" ? (
        <View style={[styles.center, { flex: 1, padding: spacing.xl }]}>
          <View style={styles.successCircle}>
            <Ionicons name="shield-checkmark" size={54} color="#fff" />
          </View>
          <AppText weight="extrabold" size={type.xl} style={{ marginTop: spacing.lg }}>You're verified!</AppText>
          <AppText color={colors.muted} style={{ textAlign: "center", marginTop: 6, lineHeight: 21 }}>
            Your KYC badge is now live. You've unlocked higher order limits and greater trust.
          </AppText>
          <Button testID="kyc-done-button" title="Done" onPress={() => router.back()} icon="checkmark" style={{ marginTop: spacing.xl, alignSelf: "stretch" }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}>
          <View style={styles.hero}>
            <Ionicons name="finger-print" size={40} color={colors.brandPrimary} />
          </View>
          <AppText weight="extrabold" size={type.xl} style={{ textAlign: "center", marginTop: spacing.lg }}>
            Verify to build trust
          </AppText>
          <AppText color={colors.muted} style={{ textAlign: "center", marginTop: 6, lineHeight: 21 }}>
            KYC keeps the community safe and unlocks higher-value orders. Your documents are handled by our verification partner.
          </AppText>

          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            {STEPS.map((s) => (
              <Card key={s.title} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={styles.stepIcon}>
                  <Ionicons name={s.icon as any} size={20} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold">{s.title}</AppText>
                  <AppText size={type.sm} color={colors.muted}>{s.text}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            ))}
          </View>
        </ScrollView>
      )}

      {phase !== "done" && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            testID="verify-button"
            title={phase === "verifying" ? "Verifying…" : "Start verification"}
            loading={phase === "verifying"}
            icon="shield-checkmark"
            onPress={verify}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hero: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: spacing.lg },
  stepIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  successCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
