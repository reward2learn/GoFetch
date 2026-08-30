import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import { AppText, Avatar, Badge, EmptyState, colors, radius, spacing, type, usd, shadow } from "@/src/components/ui";
import { formatRoute } from "@/src/locations";
import { api } from "@/src/api/client";

const TABS = ["Inbox", "My Trips"] as const;

export default function Trips() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Inbox");
  const [inbox, setInbox] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, p] = await Promise.all([api.get("/inbox"), api.get("/travel-plans/mine")]);
      setInbox(i);
      setPlans(p);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancelPlan = async (id: string) => {
    try {
      await api.post(`/travel-plans/${id}/cancel`);
      load();
    } catch {}
  };

  const renderInbox = ({ item }: { item: any }) => (
    <Pressable testID={`inbox-item-${item.id}`} onPress={() => router.push(`/request/${item.id}`)} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.94 : 1 }]}>
      <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
      <View style={{ flex: 1, gap: 4 }}>
        <Badge label={item.matchedRoute} tone="brand" icon="airplane" />
        <AppText weight="semibold" numberOfLines={1}>{item.title}</AppText>
        <View style={styles.metaRow}>
          <Avatar name={item.buyer?.name} size={18} />
          <AppText size={type.sm} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>{item.buyer?.name}</AppText>
          <View style={styles.rewardPill}>
            <Ionicons name="cash-outline" size={12} color={colors.onBrandSecondary} />
            <AppText weight="bold" size={type.sm} color={colors.onBrandSecondary}>+{usd(item.reward)}</AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderPlan = ({ item }: { item: any }) => (
    <View style={styles.planCard}>
      <View style={styles.planRoute}>
        <View style={{ flex: 1 }}>
          <AppText size={type.sm} color={colors.muted}>From</AppText>
          <AppText weight="bold" numberOfLines={1}>{formatRoute(item.fromCountry, item.fromCity)}</AppText>
        </View>
        <Ionicons name="airplane" size={18} color={colors.brandSecondary} />
        <View style={{ flex: 1 }}>
          <AppText size={type.sm} color={colors.muted}>To</AppText>
          <AppText weight="bold" numberOfLines={1}>{formatRoute(item.toCountry, item.toCity)}</AppText>
        </View>
      </View>
      {!!item.departDate && (
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <AppText size={type.sm} color={colors.muted}>Departs {item.departDate}</AppText>
        </View>
      )}
      <View style={styles.planFooter}>
        <Pressable testID={`plan-matches-${item.id}`} onPress={() => setTab("Inbox")} style={styles.matchBadge}>
          <Ionicons name="mail-unread-outline" size={14} color={colors.brandPrimary} />
          <AppText size={type.sm} weight="semibold" color={colors.brandPrimary}>
            {item.matchCount} matching {item.matchCount === 1 ? "request" : "requests"}
          </AppText>
        </Pressable>
        <Pressable testID={`cancel-plan-${item.id}`} onPress={() => cancelPlan(item.id)} hitSlop={8}>
          <AppText size={type.sm} color={colors.error} weight="semibold">Cancel</AppText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText weight="extrabold" size={type["2xl"]}>Travel</AppText>
        <View style={styles.segment}>
          {TABS.map((t) => (
            <Pressable key={t} testID={`trips-tab-${t}`} onPress={() => setTab(t)} style={[styles.segBtn, tab === t && styles.segBtnActive]}>
              <AppText size={type.sm} weight="semibold" color={tab === t ? colors.onBrandPrimary : colors.onSurfaceTertiary}>
                {t}{t === "Inbox" && inbox.length ? ` (${inbox.length})` : ""}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : tab === "Inbox" ? (
        <FlatList
          data={inbox}
          keyExtractor={(i) => i.id}
          renderItem={renderInbox}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <EmptyState
              testID="inbox-empty"
              icon="mail-outline"
              title="Your inbox is empty"
              subtitle="Post a travel plan and requests matching your route will land here automatically."
            />
          }
        />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(i) => i.id}
          renderItem={renderPlan}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <EmptyState
              testID="trips-empty"
              icon="airplane-outline"
              title="No trips shared yet"
              subtitle="Share where you're flying and earn by delivering items along the way."
            />
          }
        />
      )}

      <Pressable testID="add-trip-fab" onPress={() => router.push("/travel-plan")} style={[styles.fab, { bottom: spacing.lg }]}>
        <Ionicons name="add" size={26} color={colors.onBrandPrimary} />
        <AppText weight="bold" color={colors.onBrandPrimary} size={type.base}>Add trip</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segment: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: 3 },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm },
  segBtnActive: { backgroundColor: colors.brandPrimary },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.soft,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  rewardPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.brandSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  planCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.soft,
  },
  planRoute: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  planFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  matchBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: radius.pill,
    ...shadow.card,
  },
});
