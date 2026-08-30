import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import { AppText, Avatar, Badge, Button, Card, Divider, Stars, colors, radius, spacing, type, shadow } from "@/src/components/ui";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, refresh } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const r = await api.get(`/users/${user.id}/reviews`);
      setReviews(r);
    } catch {}
    finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { refresh(); load(); }, [load]));

  if (!user) return null;
  const verified = user.kycStatus === "verified";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing["3xl"] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refresh(); load(); }} tintColor={colors.brandPrimary} />}
      >
        {/* Header card */}
        <Card style={{ alignItems: "center", paddingVertical: spacing.xl }}>
          <Avatar name={user.name} size={84} />
          <View style={styles.nameRow}>
            <AppText weight="extrabold" size={type.xl}>{user.name}</AppText>
            {verified && <Ionicons name="checkmark-circle" size={20} color={colors.brandPrimary} />}
          </View>
          <AppText color={colors.muted} size={type.sm}>{user.email}</AppText>
          <View style={{ marginTop: spacing.sm }}>
            <Badge
              label={verified ? "KYC Verified" : "Unverified"}
              tone={verified ? "success" : "warning"}
              icon={verified ? "shield-checkmark" : "alert-circle"}
            />
          </View>

          <View style={styles.statsRow}>
            <Stat value={user.reputation ? user.reputation.toFixed(1) : "—"} label="Rating" icon="star" />
            <Divider style={styles.vDivider} />
            <Stat value={String(user.ordersCompleted)} label="Orders" icon="bag-check" />
            <Divider style={styles.vDivider} />
            <Stat value={String(user.tripsCompleted)} label="Trips" icon="airplane" />
          </View>
        </Card>

        {/* KYC prompt */}
        {!verified && (
          <Card style={{ marginTop: spacing.md, borderColor: colors.warning, backgroundColor: "#FDF6EC" }}>
            <View style={styles.kycRow}>
              <Ionicons name="shield-half" size={22} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <AppText weight="bold">Verify your identity</AppText>
                <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: 2 }}>
                  KYC unlocks higher order limits and builds trust with counterparties.
                </AppText>
              </View>
            </View>
            <Button testID="start-kyc-button" title="Complete KYC" onPress={() => router.push("/kyc")} variant="secondary" icon="finger-print" style={{ marginTop: spacing.md }} />
          </Card>
        )}

        {/* Trust / escrow explainer */}
        <Card style={{ marginTop: spacing.md }}>
          <AppText weight="bold" size={type.lg} style={{ marginBottom: spacing.sm }}>How you're protected</AppText>
          <Protect icon="lock-closed" title="Smart-contract escrow" text="Payment is locked until you confirm the handoff." />
          <Protect icon="shield" title="Traveller collateral" text="Travellers stake 15% — slashed if they flake." />
          <Protect icon="qr-code" title="Cryptographic handoff" text="A one-time QR scan releases funds — no disputes." />
          <Protect icon="ribbon" title="On-chain reputation" text="Reviews build a permanent trust score." last />
        </Card>

        {/* Reviews */}
        <AppText weight="bold" size={type.lg} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Reviews ({reviews.length})
        </AppText>
        {reviews.length === 0 ? (
          <Card>
            <AppText color={colors.muted} style={{ textAlign: "center" }}>No reviews yet</AppText>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {reviews.map((r) => (
              <Card key={r.id} style={{ padding: spacing.md }}>
                <View style={styles.reviewTop}>
                  <Avatar name={r.reviewer?.name} size={30} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" size={type.sm}>{r.reviewer?.name}</AppText>
                    <Stars value={r.rating} size={12} />
                  </View>
                </View>
                {!!r.comment && <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: 6 }}>{r.comment}</AppText>}
              </Card>
            ))}
          </View>
        )}

        <Button testID="logout-button" title="Sign out" variant="outline" icon="log-out-outline" onPress={logout} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: any }) {
  return (
    <View style={styles.stat}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name={icon} size={15} color={colors.brandSecondary} />
        <AppText weight="extrabold" size={type.xl}>{value}</AppText>
      </View>
      <AppText size={type.sm} color={colors.muted}>{label}</AppText>
    </View>
  );
}

function Protect({ icon, title, text, last }: { icon: any; title: string; text: string; last?: boolean }) {
  return (
    <View style={[styles.protect, !last && { marginBottom: spacing.md }]}>
      <View style={styles.protectIcon}>
        <Ionicons name={icon} size={16} color={colors.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" size={type.base}>{title}</AppText>
        <AppText size={type.sm} color={colors.muted}>{text}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    width: "100%",
    paddingHorizontal: spacing.sm,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  vDivider: { width: 1, height: 34 },
  kycRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  protect: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  protectIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  reviewTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
