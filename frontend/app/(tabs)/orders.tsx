import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import { AppText, Avatar, Badge, EmptyState, colors, radius, spacing, type, usd, shadow } from "@/src/components/ui";
import { STATUS_LABEL, statusColor } from "@/src/constants";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

const FILTERS = ["All", "Buying", "Traveling"] as const;

export default function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const load = useCallback(async () => {
    try {
      const data = await api.get("/orders/mine");
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = orders.filter((o) => {
    if (filter === "Buying") return o.buyerId === user?.id;
    if (filter === "Traveling") return o.travelerId === user?.id;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const asBuyer = item.buyerId === user?.id;
    const other = asBuyer ? item.traveler : item.buyer;
    const tone = statusColor(item.status);
    return (
      <Pressable
        testID={`order-card-${item.id}`}
        onPress={() => router.push(`/order/${item.id}`)}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.94 : 1 }]}
      >
        <Image source={{ uri: item.request?.image }} style={styles.thumb} contentFit="cover" />
        <View style={{ flex: 1, gap: 5 }}>
          <View style={styles.topRow}>
            <Badge label={asBuyer ? "Buying" : "Traveling"} tone={asBuyer ? "brand" : "success"} icon={asBuyer ? "bag-handle" : "airplane"} />
            <Badge label={STATUS_LABEL[item.status] || item.status} tone={tone} />
          </View>
          <AppText weight="semibold" numberOfLines={1}>
            {item.request?.title}
          </AppText>
          <View style={styles.metaRow}>
            <Avatar name={other?.name} size={20} />
            <AppText size={type.sm} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
              {other?.name || "Awaiting match"}
            </AppText>
            <AppText weight="bold" color={colors.brandPrimary}>
              {usd(item.itemPrice + item.serviceFee)}
            </AppText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText weight="extrabold" size={type["2xl"]}>
          My Orders
        </AppText>
        <View style={styles.segment}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              testID={`orders-filter-${f}`}
              onPress={() => setFilter(f)}
              style={[styles.segBtn, filter === f && styles.segBtnActive]}
            >
              <AppText
                size={type.sm}
                weight="semibold"
                color={filter === f ? colors.onBrandPrimary : colors.onSurfaceTertiary}
              >
                {f}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <EmptyState
              testID="orders-empty"
              icon="cube-outline"
              title="No orders yet"
              subtitle="Accept a request as a traveller, or post one as a buyer, to start an escrow-protected order."
            />
          }
        />
      )}
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
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: 3,
  },
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
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
});
