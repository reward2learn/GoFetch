import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";

import { AppText, Avatar, EmptyState, colors, radius, spacing, type, font, usd, shadow } from "@/src/components/ui";
import { CATEGORIES, CATEGORY_ICON, COUNTRIES } from "@/src/constants";
import { api } from "@/src/api/client";

export default function Explore() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cat, setCat] = useState("All");
  const [dest, setDest] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [destOpen, setDestOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (cat !== "All") params.append("category", cat);
    if (dest) params.append("toCountry", dest);
    if (q.trim()) params.append("q", q.trim());
    try {
      const data = await api.get(`/requests?${params.toString()}`);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    try {
      const w = await api.get("/wallet");
      setBalance(w.balance);
    } catch {}
  }, [cat, dest, q]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderCard = ({ item }: { item: any }) => (
    <Pressable
      testID={`request-card-${item.id}`}
      onPress={() => router.push(`/request/${item.id}`)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.imgWrap}>
        <Image source={{ uri: item.image }} style={styles.img} contentFit="cover" transition={200} />
        <View style={styles.rewardTag}>
          <Ionicons name="airplane" size={11} color={colors.onBrandSecondary} />
          <AppText weight="bold" size={type.sm} color={colors.onBrandSecondary}>
            +{usd(item.reward)}
          </AppText>
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 6 }}>
        <AppText weight="semibold" size={type.base} numberOfLines={2} style={{ lineHeight: 19 }}>
          {item.title}
        </AppText>
        <View style={styles.routeRow}>
          <AppText size={type.sm} color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.fromCountry}
          </AppText>
          <Ionicons name="arrow-forward" size={11} color={colors.brandSecondary} />
          <AppText size={type.sm} color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.toCountry}
          </AppText>
        </View>
        <View style={styles.buyerRow}>
          <Avatar name={item.buyer?.name} size={22} />
          <AppText size={type.sm} color={colors.onSurfaceTertiary} numberOfLines={1} style={{ flex: 1 }}>
            {item.buyer?.name}
          </AppText>
          <Ionicons name="star" size={11} color={colors.warning} />
          <AppText size={type.sm} weight="semibold">
            {item.buyer?.reputation?.toFixed(1) ?? "—"}
          </AppText>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <AppText size={type.sm} color={colors.muted}>
              Deliver to
            </AppText>
            <Pressable testID="destination-selector" onPress={() => setDestOpen(true)} style={styles.destBtn}>
              <Ionicons name="location" size={16} color={colors.brandPrimary} />
              <AppText weight="bold" size={type.lg}>
                {dest || "Anywhere"}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={colors.onSurface} />
            </Pressable>
          </View>
          <Pressable testID="wallet-chip" onPress={() => router.push("/(tabs)/wallet")} style={styles.walletChip}>
            <Ionicons name="wallet" size={16} color={colors.brandPrimary} />
            <AppText weight="bold" size={type.sm} color={colors.brandPrimary}>
              {balance == null ? "Wallet" : usd(balance)}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            testID="search-input"
            placeholder="Search perfume, sneakers, tech…"
            placeholderTextColor={colors.muted}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={load}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {!!q && (
            <Pressable onPress={() => { setQ(""); }}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroller}
        >
          {CATEGORIES.map((c) => {
            const active = c === cat;
            return (
              <Pressable
                key={c}
                testID={`category-chip-${c}`}
                onPress={() => setCat(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons
                  name={CATEGORY_ICON[c] as any}
                  size={14}
                  color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary}
                />
                <AppText
                  size={type.sm}
                  weight="semibold"
                  color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary}
                >
                  {c}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing["3xl"], gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <EmptyState
              testID="explore-empty"
              icon="globe-outline"
              title="No requests on this route yet"
              subtitle="Try changing filters, or post your own shopping request."
            />
          }
        />
      )}

      {/* Post FAB */}
      <Pressable
        testID="post-request-fab"
        onPress={() => router.push("/post")}
        style={[styles.fab, { bottom: spacing.lg }]}
      >
        <Ionicons name="add" size={26} color={colors.onBrandPrimary} />
        <AppText weight="bold" color={colors.onBrandPrimary} size={type.base}>
          Request
        </AppText>
      </Pressable>

      {/* Destination modal */}
      <Modal visible={destOpen} animationType="slide" transparent onRequestClose={() => setDestOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setDestOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <AppText weight="bold" size={type.lg} style={{ marginBottom: spacing.sm }}>
              Deliver to
            </AppText>
            <ScrollView style={{ maxHeight: 380 }}>
              <Pressable style={styles.destItem} onPress={() => { setDest(null); setDestOpen(false); }}>
                <AppText size={type.lg} weight={!dest ? "bold" : "regular"}>Anywhere</AppText>
                {!dest && <Ionicons name="checkmark-circle" size={20} color={colors.brandPrimary} />}
              </Pressable>
              {COUNTRIES.map((c) => (
                <Pressable key={c} style={styles.destItem} onPress={() => { setDest(c); setDestOpen(false); }}>
                  <AppText size={type.lg} weight={dest === c ? "bold" : "regular"}>{c}</AppText>
                  {dest === c && <Ionicons name="checkmark-circle" size={20} color={colors.brandPrimary} />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  destBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceTertiary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: { flex: 1, fontFamily: font.medium, fontSize: type.base, color: colors.onSurface },
  chipScroller: { marginTop: spacing.md },
  chipRow: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    height: 36,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.soft,
  },
  imgWrap: { width: "100%", aspectRatio: 1.1, backgroundColor: colors.surfaceTertiary },
  img: { width: "100%", height: "100%" },
  rewardTag: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  buyerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
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
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  destItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
