import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import { AppText, EmptyState, colors, radius, spacing, type, shadow } from "@/src/components/ui";
import { api } from "@/src/api/client";

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/notifications");
      setItems(data);
      await api.post("/notifications/read-all");
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const render = ({ item }: { item: any }) => (
    <Pressable
      testID={`notif-${item.id}`}
      onPress={() => item.requestId && router.push(`/request/${item.requestId}`)}
      style={({ pressed }) => [styles.card, !item.read && styles.unread, { opacity: pressed ? 0.94 : 1 }]}
    >
      <View style={styles.icon}>
        <Ionicons name="airplane" size={18} color={colors.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="bold" size={type.base}>{item.title}</AppText>
        <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: 2, lineHeight: 19 }}>{item.body}</AppText>
        <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4 }}>{timeAgo(item.createdAt)}</AppText>
      </View>
      {item.requestId && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="notif-back" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Alerts</AppText>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={render}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <EmptyState testID="alerts-empty" icon="notifications-outline" title="No alerts yet" subtitle="We'll notify you when a traveller can deliver one of your requests." />
          }
        />
      )}
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.soft,
  },
  unread: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
});
