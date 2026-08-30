import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppText, colors, spacing, type } from "@/src/components/ui";

export type LegalSection = { heading: string; body: string };

export function LegalLayout({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="legal-back" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>{title}</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing["3xl"] }}>
        <AppText size={type.sm} color={colors.muted}>Last updated {updated}</AppText>
        <AppText color={colors.onSurfaceTertiary} style={{ marginTop: spacing.md, lineHeight: 22 }}>{intro}</AppText>
        {sections.map((s, i) => (
          <View key={i} style={{ marginTop: spacing.xl }}>
            <AppText weight="bold" size={type.lg} style={{ marginBottom: spacing.sm }}>{`${i + 1}. ${s.heading}`}</AppText>
            <AppText color={colors.onSurfaceTertiary} style={{ lineHeight: 22 }}>{s.body}</AppText>
          </View>
        ))}
        <AppText size={type.sm} color={colors.muted} style={{ marginTop: spacing["2xl"], lineHeight: 20 }}>
          This document is provided for the TrustMule product experience and is not legal advice. Consult a qualified professional before relying on it in production.
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
