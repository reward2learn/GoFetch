import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import { AppText, Avatar, Badge, Card, Divider, Stars, colors, radius, spacing, type, shadow } from "@/src/components/ui";
import { api } from "@/src/api/client";

export default function UserProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([api.get(`/users/${id}`), api.get(`/users/${id}/reviews`)]);
      setUser(u);
      setReviews(r);
    } catch {}
    finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !user) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const verified = user.kycStatus === "verified";

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="user-back" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Member</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing["3xl"] }}>
        <Card style={{ alignItems: "center", paddingVertical: spacing.xl }}>
          <Avatar name={user.name} size={80} />
          <View style={styles.nameRow}>
            <AppText weight="extrabold" size={type.xl}>{user.name}</AppText>
            {verified && <Ionicons name="checkmark-circle" size={18} color={colors.brandPrimary} />}
          </View>
          <View style={{ marginTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Stars value={user.reputation} size={18} />
            <AppText weight="bold">{user.reputation ? user.reputation.toFixed(1) : "New"}</AppText>
            <AppText color={colors.muted} size={type.sm}>({user.reviewsCount})</AppText>
          </View>
          <View style={{ marginTop: spacing.sm, flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
            <Badge
              label={verified ? "KYC Verified" : "Unverified"}
              tone={verified ? "success" : "warning"}
              icon={verified ? "shield-checkmark" : "alert-circle"}
            />
            {user.topTraveller && <Badge label="Top Traveller" tone="warning" icon="ribbon" />}
          </View>
          <View style={styles.statsRow}>
            <Stat value={String(user.ordersCompleted)} label="Orders" icon="bag-check" />
            <Divider style={styles.vDivider} />
            <Stat value={String(user.tripsCompleted)} label="Trips" icon="airplane" />
            <Divider style={styles.vDivider} />
            <Stat value={String(user.reviewsCount)} label="Reviews" icon="star" />
          </View>
        </Card>

        <AppText weight="bold" size={type.lg} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Ratings & reviews
        </AppText>
        {reviews.length === 0 ? (
          <Card><AppText color={colors.muted} style={{ textAlign: "center" }}>No reviews yet</AppText></Card>
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg, width: "100%", paddingHorizontal: spacing.sm },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  vDivider: { width: 1, height: 34 },
  reviewTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
