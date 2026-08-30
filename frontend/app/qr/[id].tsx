import React, { useCallback, useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, shadow } from "@/src/components/ui";
import { api } from "@/src/api/client";

export default function ShowQR() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payload, setPayload] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [err, setErr] = useState("");

  const generate = useCallback(async () => {
    try {
      const [o, res] = await Promise.all([api.get(`/orders/${id}`), api.post(`/orders/${id}/qr`)]);
      setOrder(o);
      setPayload(res.payload);
    } catch (e: any) {
      setErr(e.message || "Could not generate code.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    generate();
    const t = setInterval(async () => {
      try {
        const o = await api.get(`/orders/${id}`);
        setOrder(o);
        if (o.status === "completed") {
          clearInterval(t);
          router.replace(`/order/${id}`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [generate, id]));

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="qr-close" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Confirm handoff</AppText>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.stepBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <AppText weight="semibold" size={type.sm} color={colors.success}>Inspect the item first</AppText>
        </View>
        <AppText weight="extrabold" size={type.xl} style={{ textAlign: "center", marginTop: spacing.md }}>
          Show this to the traveller
        </AppText>
        <AppText color={colors.muted} style={{ textAlign: "center", marginTop: 6, lineHeight: 21, paddingHorizontal: spacing.lg }}>
          Only reveal this code once you've received and checked the item. Scanning it instantly releases the escrow — this can't be undone.
        </AppText>

        <View style={styles.qrCard}>
          {loading ? (
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          ) : payload ? (
            <QRCode value={payload} size={220} color={colors.onSurface} backgroundColor="#fff" />
          ) : (
            <AppText color={colors.error}>{err}</AppText>
          )}
        </View>

        <View style={styles.waitRow}>
          <ActivityIndicator color={colors.brandPrimary} />
          <AppText color={colors.muted}>Waiting for traveller to scan…</AppText>
        </View>

        {payload && (
          <Pressable testID="reveal-code" onPress={() => setShowCode((s) => !s)} style={{ marginTop: spacing.md }}>
            <AppText size={type.sm} color={colors.brandPrimary} weight="semibold">
              {showCode ? "Hide code" : "Can't scan? Show code"}
            </AppText>
          </Pressable>
        )}
        {showCode && payload && (
          <View style={styles.codeBox}>
            <AppText size={type.sm} weight="semibold" selectable style={{ textAlign: "center" }}>{payload}</AppText>
          </View>
        )}
      </View>

      <View style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.md }}>
        <Button testID="regenerate-qr" title="Regenerate code" variant="outline" icon="refresh" onPress={generate} />
      </View>
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
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E1F0E8",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  qrCard: {
    width: 280,
    height: 280,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xl,
    ...shadow.card,
  },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    maxWidth: "90%",
  },
});
